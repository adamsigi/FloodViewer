
import os
import shutil
import logging
import matplotlib
import numpy as np
import rasterio as rio
import geopandas as gpd
import pandas as pd
import xarray as xr
import contextily as ctx
import branca.colormap as cm
from datetime import datetime, timedelta
from floodviewer.settings import (
    PRODUCTS_PATH,
    WORKSPACE_PATH,
    FLOODPY_HOME,
    GPTBIN_PATH,
    SNAP_ORBIT_PATH,
    CDS_API_RC_PATH,
    COPERNICUS_USERNAME,
    COPERNICUS_PASSWORD,
    CDSAPI_UID,
    CDSAPI_KEY
)
from api.celery_worker.geoserver_manager import GeoserverManager
from api.celery_worker.names import Names
from floodpy.FLOODPYapp import FloodwaterEstimation


worker_workspace = os.path.join(WORKSPACE_PATH, str(os.getpid()))
geoserver_manager = GeoserverManager()
logger = logging.getLogger('my_logger')


class Floodpy:
    """
    Run floodpy and save the results.
    """

    def __init__(self, floodmap_data):
        self.floodmap_data = floodmap_data
        self.product_data = {}
        self.error_trace = ''
        self.names = Names(floodmap_data['id'])

    def download_precipitation_data(self):
        logger.info('Clean workspace')
        self._config_dirs()
        self._config_cds_creds()
        params_dict = {
            # Path to the directory where floodpy stores assets for each floodmap.
            # One per worker, to be cleaned after job is done.
            'projectfolder': worker_workspace,
            # Description of the flood event.
            'flood_event': self.floodmap_data['name'],
            # Path to the directory containing the floodpy source code.
            'src_dir': FLOODPY_HOME,
            # Path to the Sentinel-1 orbit data directory.
            'snap_orbit_dir': SNAP_ORBIT_PATH,
            # Path to the SNAP GPT executable.
            'GPTBIN_PATH': GPTBIN_PATH,
            'pre_flood_start': self._get_pre_flood_start(),
            'pre_flood_end': self._get_pre_flood_end(),
            'flood_start': self._get_flood_start(),
            'flood_end': self._get_flood_end(),
            'AOI_File': 'None',
            'LONMIN': self.floodmap_data['bbox']['min_lng'],
            'LATMIN': self.floodmap_data['bbox']['min_lat'],
            'LONMAX': self.floodmap_data['bbox']['max_lng'],
            'LATMAX': self.floodmap_data['bbox']['max_lat'],
            'relOrbit': 'Auto',
            'minimum_mapping_unit_area_m2': 4000,
            'CPU': 2,
            'RAM': 16,
            'Copernicus_username': COPERNICUS_USERNAME,
            'Copernicus_password': COPERNICUS_PASSWORD,
        }
        logger.info(f'Create floodpy driver with params: {params_dict}')
        self.Floodpy_app = FloodwaterEstimation(params_dict = params_dict)
        logger.info('Download landcover data')
        self.Floodpy_app.download_landcover_data()
        logger.info('Download ERA5 precipitation data')
        self.Floodpy_app.download_ERA5_Precipitation_data()
        logger.info('Query S1 data')
        self.Floodpy_app.query_S1_data()
        if (len(self.Floodpy_app.flood_datetimes) == 0):
            self.error_trace = 'No days with enough precipitation were found around the provided date!'
            logger.error(self.error_trace)
            return False
        return True

    def download_sentinel_1_images(self):
        # Use the first available date.
        sel_flood_date = self.Floodpy_app.flood_datetimes[0]
        logger.info('Select S1 data')
        self.Floodpy_app.sel_S1_data(sel_flood_date)
        logger.info('Download S1 GRD products')
        self.Floodpy_app.download_S1_GRD_products()
        logger.info('Download S1 orbits')
        self.Floodpy_app.download_S1_orbits()
        return True

    def preprocess_sentinel_1_images(self):
        logger.info('Create S1 stack')
        self.Floodpy_app.create_S1_stack(overwrite=True)
        logger.info('Calculate slope')
        self.Floodpy_app.calc_slope()
        return True

    def performing_statistical_analysis(self):
        logger.info('Calculate T scores')
        self.Floodpy_app.calc_t_scores()
        return True

    def classify_floodwater(self):
        logger.info('Calculate floodmap data')
        self.Floodpy_app.calc_floodmap_dataset()
        return True

    def commit_results(self):

        # Read AOI
        aoi = gpd.read_file(self.Floodpy_app.geojson_bbox)

        # AOI bounds
        left, bottom, right, top = aoi.total_bounds

        #------------------------------------------------------------------------------
        # ESA worldcover
        logger.info('Create ESA worldcover geotiff')
        with rio.open(self.Floodpy_app.lc_mosaic_filename) as src:
            LC_cover, out_transform = rio.mask.mask(src, aoi.geometry, crop=True)
            LC_cover = LC_cover[0,:,:]

        # Apply colormap and normalize to uint8
        height, width = LC_cover.shape
        row_colored = np.array(list(map(lambda x: self.Floodpy_app.LC_COLORBAR[x], LC_cover.ravel())))
        LC_colored = row_colored.reshape((height, width, row_colored.shape[1]))

        with np.errstate(divide="ignore", invalid="ignore"):
            LC_colored = LC_colored * 255.0  / LC_colored.max(axis=(0, 1)).reshape((1, 1, 4))
            LC_colored[~np.isfinite(LC_colored)] = 0
            LC_colored = LC_colored.astype("uint8")

        # Transform to geotiff and save
        transform = rio.transform.from_bounds(left, bottom, right, top, width, height)

        with rio.open(
            fp=os.path.join(PRODUCTS_PATH, self.names.data_directory(), self.names.esa_world_cover()[1]),
            mode="w",
            driver="GTiff",
            height=height,
            width=width,
            count=4,  # RGBA
            dtype=LC_colored.dtype,
            crs="EPSG:4326",
            transform=transform,
        ) as dst:
            for i in range(4):  # loop over RGBA bands
                dst.write(LC_colored[:, :, i], i + 1)

        # Land cover categories to be saved in DB products
        self.land_cover_categories = np.unique(LC_cover).tolist()

        # ------------------------------------------------------------------------------
        # S1 VV backscatter Flood image
        logger.info('Create S1 VV backscatter geotiff')
        S1_stack_dB = xr.open_dataset(self.Floodpy_app.S1_stack_filename)['VV_dB']
        Flood_data = S1_stack_dB.sel(time = pd.to_datetime(self.Floodpy_app.flood_datetime_str)).values

        # S1 backscatter quantiles to be saved in DB products
        self.s1_backscatter_vmin = np.nanquantile(Flood_data, 0.01)
        self.s1_backscatter_vmax = np.nanquantile(Flood_data, 0.99)

        S1_data = np.clip(Flood_data, self.s1_backscatter_vmin, self.s1_backscatter_vmax)

        cmap = cm.LinearColormap(['black', 'white'],
                                 index=[self.s1_backscatter_vmin, self.s1_backscatter_vmax],
                                 vmin=self.s1_backscatter_vmin,
                                 vmax=self.s1_backscatter_vmax)

        # Apply colormap and normalize to uint8
        height, width = S1_data.shape
        cmap_func = lambda x: matplotlib.colors.to_rgba(cmap(x)) if ~np.isnan(x) else (0,0,0,0)
        row_colored = np.array(list(map(cmap_func, S1_data.ravel())))
        S1_colored = row_colored.reshape((height, width, row_colored.shape[1]))

        with np.errstate(divide="ignore", invalid="ignore"):
            S1_colored = S1_colored * 255.0  / S1_colored.max(axis=(0, 1)).reshape((1, 1, 4))
            S1_colored[~np.isfinite(S1_colored)] = 0
            S1_colored = S1_colored.astype("uint8")

        # Transform to geotiff and save
        transform = rio.transform.from_bounds(left, bottom, right, top, width, height)

        with rio.open(
            fp=os.path.join(PRODUCTS_PATH, self.names.data_directory(), self.names.s1_backscatter()[1]),
            mode="w",
            driver="GTiff",
            height=height,
            width=width,
            count=4,  # RGBA
            dtype=S1_colored.dtype,
            crs="EPSG:4326",  # same as OpenStreetMaps (?)
            transform=transform,
        ) as dst:
            for i in range(4):  # loop over RGBA bands
                dst.write(S1_colored[:, :, i], i + 1)

        #------------------------------------------------------------------------------
        # T-scores
        logger.info('Create T-scores geotiff')
        t_scores = xr.open_dataset(self.Floodpy_app.t_score_filename)[self.Floodpy_app.polar_comb].values

        # T score quantiles to be saved in DB products
        self.tscore_vmin = np.nanquantile(t_scores.flatten(), 0.005)
        self.tscore_vmax = np.nanquantile(t_scores.flatten(), 0.995)
        t_scores = np.clip(t_scores, self.tscore_vmin, self.tscore_vmax)

        cmap = cm.LinearColormap(['red', 'white', 'lightgreen'],
                                 index=[self.tscore_vmin, 0, self.tscore_vmax],
                                 vmin=self.tscore_vmin,
                                 vmax=self.tscore_vmax)


        # Apply colormap and normalize to uint8
        height, width = t_scores.shape
        cmap_func = lambda x: matplotlib.colors.to_rgba(cmap(x)) if ~np.isnan(x) else (0,0,0,0)
        row_colored = np.array(list(map(cmap_func, t_scores.ravel())))
        t_scores = row_colored.reshape((height, width, row_colored.shape[1]))

        with np.errstate(divide="ignore", invalid="ignore"):
            t_scores = t_scores * 255.0  / t_scores.max(axis=(0, 1)).reshape((1, 1, 4))
            t_scores[~np.isfinite(t_scores)] = 0
            t_scores = t_scores.astype("uint8")

        # Transform to geotiff and save
        from rasterio.transform import from_bounds
        transform = from_bounds(left, bottom, right, top, width, height)

        with rio.open(
            fp=os.path.join(PRODUCTS_PATH, self.names.data_directory(), self.names.t_score()[1]),
            mode="w",
            driver="GTiff",
            height=height,
            width=width,
            count=4,  # RGBA
            dtype=t_scores.dtype,
            crs="EPSG:4326",
            transform=transform,
        ) as dst:
            for i in range(4):
                dst.write(t_scores[:, :, i], i + 1)

        #------------------------------------------------------------------------------
        # Flood binary mask
        logger.info('Create flood binary mask geotiff')
        Flood_map_dataset = xr.open_dataset(self.Floodpy_app.Flood_map_dataset_filename)
        flooded_regions = Flood_map_dataset.Flood_local_map_RG_morph.values

        # Apply colormap and normalize to uint8
        height, width = flooded_regions.shape
        raster_to_coloridx = {1: (0.0, 0.0, 1.0, 0.8), 0: (0.0, 0.0, 0.0, 0.0)}
        colormap = lambda x: raster_to_coloridx[x]
        row_colored = np.array(list(map(colormap, flooded_regions.ravel())))
        flooded_regions = row_colored.reshape((height, width, row_colored.shape[1]))

        with np.errstate(divide="ignore", invalid="ignore"):
            flooded_regions = flooded_regions * 255.0  / flooded_regions.max(axis=(0, 1)).reshape((1, 1, 4))
            flooded_regions[~np.isfinite(flooded_regions)] = 0
            flooded_regions = flooded_regions.astype("uint8")

        # Transform to geotiff and save
        from rasterio.transform import from_bounds
        transform = from_bounds(left, bottom, right, top, width, height)

        with rio.open(
            fp=os.path.join(PRODUCTS_PATH, self.names.data_directory(), self.names.flooded_regions()[1]),
            mode="w",
            driver="GTiff",
            height=height,
            width=width,
            count=4,
            dtype=flooded_regions.dtype,
            crs="EPSG:4326",
            transform=transform,
        ) as dst:
            for i in range(4):
                dst.write(flooded_regions[:, :, i], i + 1)

        #------------------------------------------------------------------------------
        # Thumbnail background
        logger.info('Create thumbnail background geotiff')
        self._bounds2raster4326(
            left,
            bottom,
            right,
            top,
            ll=True,
            path=os.path.join(PRODUCTS_PATH, self.names.data_directory(), self.names.thumbnail()[1]),
            source=ctx.providers.OpenStreetMap.Mapnik)

        logger.info('Commit to DB and to Geoserver')
        self._update_geoserver()
        self._set_product_data()
        return True


    def _update_geoserver(self):
        workspace = self.names.workspace()
        if not geoserver_manager.create_workspace(workspace):
            raise Exception("Failed to create workspace on geoserver")

        esa_store, esa_geotiff, esa_layer = self.names.esa_world_cover()
        esa_geotiff_relative_path = os.path.join(self.names.data_directory(), esa_geotiff)
        if not geoserver_manager.create_store_and_layer(esa_store, esa_geotiff_relative_path, esa_layer, workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create store or layer for esa world cover on geoserver")

        s1_store, s1_geotiff, s1_layer = self.names.s1_backscatter()
        s1_geotiff_relative_path = os.path.join(self.names.data_directory(), s1_geotiff)
        if not geoserver_manager.create_store_and_layer(s1_store, s1_geotiff_relative_path, s1_layer, workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create store or layer for s1 backscatter on geoserver")

        t_score_store, t_score_geotiff, t_score_layer = self.names.t_score()
        t_score_geotiff_relative_path = os.path.join(self.names.data_directory(), t_score_geotiff)
        if not geoserver_manager.create_store_and_layer(t_score_store, t_score_geotiff_relative_path, t_score_layer, workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create store or layer for t score on geoserver")

        flooded_store, flooded_geotiff, flooded_layer = self.names.flooded_regions()
        flooded_geotiff_relative_path = os.path.join(self.names.data_directory(), flooded_geotiff)
        if not geoserver_manager.create_store_and_layer(flooded_store, flooded_geotiff_relative_path, flooded_layer, workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create store or layer for flooded regions on geoserver")

        thumbnail_store, thumbnail_geotiff, thumbnail_layer, thumbnail_layer_group = self.names.thumbnail()
        thumbnail_geotiff_relative_path = os.path.join(self.names.data_directory(), thumbnail_geotiff)
        if not geoserver_manager.create_store_and_layer(thumbnail_store, thumbnail_geotiff_relative_path, thumbnail_layer, workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create store or layer for thumbnail on geoserver")
        bbox = self.floodmap_data['bbox']
        if not geoserver_manager.create_layer_group(
                thumbnail_layer_group,
                [thumbnail_layer, flooded_layer],
                {
                    "min_lat": bbox['min_lat'],
                    "min_lng": bbox['min_lng'],
                    "max_lat": bbox['max_lat'],
                    "max_lng": bbox['max_lng']
                },
                workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create layer group for thumbnail on geoserver")

    def _set_product_data(self):
        self.product_data = {
            'floodmap': self.floodmap_data['id'],
            'geoserver_workspace': self.names.workspace(),
            'esa_world_cover_layer': self.names.esa_world_cover()[2],
            's1_backscatter_layer': self.names.s1_backscatter()[2],
            't_score_layer': self.names.t_score()[2],
            'flooded_regions_layer': self.names.flooded_regions()[2],
            'thumbnail_url_params': geoserver_manager.get_layer_group_png_params(self.names.thumbnail()[3], self.names.workspace()),
            'land_cover_categories': self.land_cover_categories,
            's1_backscatter_quantiles': [self.s1_backscatter_vmin, self.s1_backscatter_vmax],
            't_score_quantiles': [self.tscore_vmin, self.tscore_vmax],
        }

    def _config_cds_creds(self):
        if os.path.exists(CDS_API_RC_PATH):
            return
        with open(CDS_API_RC_PATH, "w+") as file:
            file.write((
                f"url: {CDSAPI_UID}\n"
                f"key: {CDSAPI_KEY}\n"))

    def _config_dirs(self):
        # Need to clean exiting content of workspace.
        shutil.rmtree(worker_workspace, ignore_errors=True)
        os.makedirs(worker_workspace)
        os.makedirs(PRODUCTS_PATH, exist_ok=True)
        os.makedirs(os.path.join(PRODUCTS_PATH, self.names.data_directory()))

    def _get_pre_flood_start(self):
        dt = datetime.strptime(self.floodmap_data['flood_date'], '%Y-%m-%dT%H:%M:%SZ')
        shifted_dt = dt - timedelta(days=self.floodmap_data['days_before_flood'])
        return shifted_dt.strftime('%Y%m%dT%H%M%S')
    
    def _get_pre_flood_end(self):
        dt = datetime.strptime(self.floodmap_data['flood_date'], '%Y-%m-%dT%H:%M:%SZ')
        return dt.strftime('%Y%m%dT%H%M%S')

    def _get_flood_start(self):
        return self._get_pre_flood_end()

    def _get_flood_end(self):
        dt = datetime.strptime(self.floodmap_data['flood_date'], '%Y-%m-%dT%H:%M:%SZ')
        shifted_dt = dt + timedelta(days=self.floodmap_data['days_after_flood'])
        return shifted_dt.strftime('%Y%m%dT%H%M%S')

    def _bounds2raster4326(self, w, s, e, n, path, zoom="auto", source=None, ll=False, wait=0, max_retries=2, n_connections=1, use_cache=True):
        # Download thumbnail background
        img, ext = ctx.bounds2img(
            w,
            s,
            e,
            n,
            zoom=zoom,
            source=source,
            ll=True,
            n_connections=n_connections,
            use_cache=use_cache,
        )

        img_w, ext_w = ctx.warp_tiles(img=img, extent=ext, t_crs="EPSG:4326")

        h, w, b = img_w.shape
        # --- https://mapbox.github.io/rasterio/quickstart.html#opening-a-dataset-in-writing-mode
        minX, maxX, minY, maxY = ext_w
        x = np.linspace(minX, maxX, w)
        y = np.linspace(minY, maxY, h)
        resX = (x[-1] - x[0]) / w
        resY = (y[-1] - y[0]) / h
        transform = rio.transform.from_origin(x[0] - resX / 2, y[-1] + resY / 2, resX, resY)
        
        with rio.open(
            path,
            "w",
            driver="GTiff",
            height=h,
            width=w,
            count=b,
            dtype=img_w.dtype,
            crs="EPSG:4326",
            transform=transform,
        ) as raster:
            for band in range(b):
                raster.write(img_w[:, :, band], band + 1)
        return img_w, ext_w

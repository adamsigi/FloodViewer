
import time
import logging
import numpy as np
from os import path, makedirs
from PIL import Image
import rasterio as rio
from floodviewer.settings import PRODUCTS_PATH
from api.celery_worker.geoserver_manager import GeoserverManager
from api.celery_worker.names import Names

STEP_DELAY_SECS = 1
TESTING_IMAGES_DIR_PATH = path.abspath('media/testing_images')
geoserver_manager = GeoserverManager()
logger = logging.getLogger(__name__)

class FloodpyMock:
    """
    Mock the execution of floodpy.
    The creation of new assets from floodpy is mocked by coping existing test images.
    """

    def __init__(self, floodmap_data):
        self.floodmap_data = floodmap_data
        self.product_data = {}
        self.error_trace = ''
        self.names = Names(floodmap_data['id'])

    def download_precipitation_data(self):
        logger.info('Simulate download_precipitation_data')
        time.sleep(STEP_DELAY_SECS)
        return True

    def download_sentinel_1_images(self):
        logger.info('Simulate download_sentinel_1_images')
        time.sleep(STEP_DELAY_SECS)
        return True

    def preprocess_sentinel_1_images(self):
        logger.info('Simulate preprocess_sentinel_1_images')
        time.sleep(STEP_DELAY_SECS)
        return True

    def performing_statistical_analysis(self):
        logger.info('Simulate performing_statistical_analysis')
        time.sleep(STEP_DELAY_SECS)
        return True

    def classify_floodwater(self):
        logger.info('Simulate classify_floodwater')
        time.sleep(STEP_DELAY_SECS)
        return True

    def commit_results(self):
        logger.info('Simulate commit_results')
        self._create_assets()
        self._update_geoserver()
        self._set_product_data()
        return True

    def _create_assets(self):
        test_file_per_product = [
            ('esa_world_cover_test.png', self.names.esa_world_cover()[1]),
            ('s1_backscatter_test.png', self.names.s1_backscatter()[1]),
            ('t_score_test.png', self.names.t_score()[1]),
            ('flooded_regions_test.png', self.names.flooded_regions()[1]),
            ('thumbnail_test.png', self.names.thumbnail()[1])
        ]
        data_directory_path = path.join(PRODUCTS_PATH, self.names.data_directory())
        makedirs(data_directory_path)
        for test_file, product_file in test_file_per_product:
            src = path.join(TESTING_IMAGES_DIR_PATH, test_file)
            dest = path.join(data_directory_path, product_file)
            self._png_to_geotiff(src, dest)

    def _update_geoserver(self):
        workspace = self.names.workspace()
        if not geoserver_manager.create_workspace(workspace):
            raise Exception("Failed to create workspace on geoserver")

        esa_store, esa_geotiff, esa_layer = self.names.esa_world_cover()
        esa_geotiff_relative_path = path.join(self.names.data_directory(), esa_geotiff)
        if not geoserver_manager.create_store_and_layer(esa_store, esa_geotiff_relative_path, esa_layer, workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create store or layer for esa world cover on geoserver")

        s1_store, s1_geotiff, s1_layer = self.names.s1_backscatter()
        s1_geotiff_relative_path = path.join(self.names.data_directory(), s1_geotiff)
        if not geoserver_manager.create_store_and_layer(s1_store, s1_geotiff_relative_path, s1_layer, workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create store or layer for s1 backscatter on geoserver")

        t_score_store, t_score_geotiff, t_score_layer = self.names.t_score()
        t_score_geotiff_relative_path = path.join(self.names.data_directory(), t_score_geotiff)
        if not geoserver_manager.create_store_and_layer(t_score_store, t_score_geotiff_relative_path, t_score_layer, workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create store or layer for t score on geoserver")

        flooded_store, flooded_geotiff, flooded_layer = self.names.flooded_regions()
        flooded_geotiff_relative_path = path.join(self.names.data_directory(), flooded_geotiff)
        if not geoserver_manager.create_store_and_layer(flooded_store, flooded_geotiff_relative_path, flooded_layer, workspace):
            geoserver_manager.delete_workspace_recursively(workspace)
            raise Exception(
                "Failed to create store or layer for flooded regions on geoserver")

        thumbnail_store, thumbnail_geotiff, thumbnail_layer, thumbnail_layer_group = self.names.thumbnail()
        thumbnail_geotiff_relative_path = path.join(self.names.data_directory(), thumbnail_geotiff)
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
            'land_cover_categories': [0, 10, 20, 30, 40, 50, 60, 80],  # params that match the test geotiffs.
            's1_backscatter_quantiles': [-15, 0],
            't_score_quantiles': [-16, 79],
        }

    def _png_to_geotiff(self, png_path, geotiff_path):
        with Image.open(png_path) as img:
            img = img.convert("RGBA")
            width, height = img.size
            data = np.array(img)

        bbox = self.floodmap_data['bbox']
        transform = rio.transform.from_bounds(bbox['min_lng'], bbox['min_lat'], bbox['max_lng'], bbox['max_lat'], width, height)
        with rio.open(
            geotiff_path,
            "w",
            driver="GTiff",
            height=height,
            width=width,
            count=4,
            dtype=data.dtype,
            crs="EPSG:4326",
            transform=transform,
        ) as dst:
            for i in range(4):
                dst.write(data[:, :, i], i + 1)

import logging
import requests
from os import path
from floodviewer.settings import (
    GEOSERVER_URL,
    GEOSERVER_ADMIN_USER,
    GEOSERVER_ADMIN_PASSWORD,
    GEOSERVER_DATA_PATH,
    THUMBNAIL_SIZE
)

logger = logging.getLogger(__name__)


class GeoserverManager:
    def create_workspace(self, workspace_name):
        payload = f'''
        <workspace>
          <name>{workspace_name}</name>
        </workspace>
        '''
        headers = {"Content-Type": "application/xml"}
        endpoint = f"{GEOSERVER_URL}/geoserver/rest/workspaces"
        try:
            response = requests.post(
                url=endpoint,
                data=payload,
                headers=headers,
                auth=(GEOSERVER_ADMIN_USER, GEOSERVER_ADMIN_PASSWORD)
            )
        except requests.exceptions.ConnectionError:
            logger.error("Connection Error!")
            return False
        if response.status_code == 201:
            return True
        else:
            logger.error(f"Failed to create workspace. Status: {response.status_code}")
            return False

    def delete_workspace_recursively(self, workspace_name):
        endpoint = f"{GEOSERVER_URL}/geoserver/rest/workspaces/{workspace_name}?recurse=true"
        try:
            response = requests.delete(url=endpoint, auth=(GEOSERVER_ADMIN_USER, GEOSERVER_ADMIN_PASSWORD))
        except requests.exceptions.ConnectionError:
            logger.error("Connection Error!")
            return False
        if response.status_code == 200:
            return True
        else:
            logger.error(f"Failed to delete workspace. Status: {response.status_code}")
            return False

    def create_geotiff_store(self, store_name, geotiff_relative_path, workspace_name):
        path_to_geotiff = path.join(GEOSERVER_DATA_PATH, geotiff_relative_path)
        payload = f'''
        <coverageStore>
          <name>{store_name}</name>
          <type>GeoTIFF</type>
          <enabled>true</enabled>
          <workspace>
            <name>{workspace_name}</name>
          </workspace>
          <url>{path_to_geotiff}</url>
        </coverageStore>
        '''
        headers = {"Content-Type": "application/xml"}
        endpoint = f"{GEOSERVER_URL}/geoserver/rest/workspaces/{workspace_name}/coveragestores"
        try:
            response = requests.post(
                url=endpoint,
                data=payload,
                headers=headers,
                auth=(GEOSERVER_ADMIN_USER, GEOSERVER_ADMIN_PASSWORD)
            )
        except requests.exceptions.ConnectionError:
            logger.error("Connection Error!")
            return False
        if response.status_code == 201:
            return True
        else:
            logger.error(f"Failed to create store. Status: {response.status_code}")
            return False

    def create_layer(self, layer_name, store_name, workspace_name):
        payload = f'''
        <coverage>
          <name>{layer_name}</name>
          <enabled>true</enabled>
        </coverage>
        '''
        headers = {"Content-Type": "application/xml"}
        endpoint = f"{GEOSERVER_URL}/geoserver/rest/workspaces/{workspace_name}/coveragestores/{store_name}/coverages"
        try:
            response = requests.post(
                url=endpoint,
                data=payload,
                headers=headers,
                auth=(GEOSERVER_ADMIN_USER, GEOSERVER_ADMIN_PASSWORD)
            )
        except requests.exceptions.ConnectionError:
            logger.error("Connection Error!")
            return False
        if response.status_code == 201:
            return True
        else:
            logger.error(f"Failed to create layer. Status: {response.status_code}")
            return False

    def create_layer_group(self, group_name, layer_names, bbox, workspace_name):
        layers_str = ''.join([f'<layer>{layer_name}</layer>' for layer_name in layer_names])
        payload = f'''<layerGroup>
                        <name>{group_name}</name>
                        <workspace>
                            <name>{workspace_name}</name>
                        </workspace>
                        <layers>
                            {layers_str}
                        </layers>
                        <bounds>
                            <minx>{bbox["min_lng"]}</minx>
                            <maxx>{bbox["max_lng"]}</maxx>
                            <miny>{bbox["min_lat"]}</miny>
                            <maxy>{bbox["max_lat"]}</maxy>
                            <crs>EPSG:4326</crs>
                        </bounds>
                        <enabled>true</enabled>
                    </layerGroup>'''
        headers = {"Content-Type": "application/xml"}
        endpoint = f"{GEOSERVER_URL}/geoserver/rest/workspaces/{workspace_name}/layergroups"
        try:
            response = requests.post(
                url=endpoint,
                data=payload,
                headers=headers,
                auth=(GEOSERVER_ADMIN_USER, GEOSERVER_ADMIN_PASSWORD)
            )
        except requests.exceptions.ConnectionError:
            logger.error("Connection Error!")
            return False
        if response.status_code == 201:
            return True
        else:
            logger.error(f"Failed to create layer group. Status: {response.status_code}")
            return False

    def create_store_and_layer(self, store_name, geotiff_relative_path, layer_name, workspace_name):
        is_store_created = self.create_geotiff_store(store_name, geotiff_relative_path, workspace_name)
        if not is_store_created:
            return False
        is_layer_created = self.create_layer(layer_name, store_name, workspace_name)
        if not is_layer_created:
            return False
        return True

    def get_layer_group_png_params(self, layer_group_name, workspace_name):
        endpoint = f"{GEOSERVER_URL}/geoserver/rest/workspaces/{workspace_name}/layergroups/{layer_group_name}"
        try:
            response = requests.get(endpoint, auth=(GEOSERVER_ADMIN_USER, GEOSERVER_ADMIN_PASSWORD))
        except requests.exceptions.ConnectionError:
            logger.error("Connection Error!")
            return False
        if response.status_code == 200:
            layergroup_info = response.json()
            bbox = layergroup_info['layerGroup']['bounds']
            aspect_ratio = (bbox['maxx'] - bbox['minx']) / (bbox['maxy'] - bbox['miny'])
            width = THUMBNAIL_SIZE
            height = THUMBNAIL_SIZE / aspect_ratio
            if aspect_ratio < 1:
                width = THUMBNAIL_SIZE * aspect_ratio
                height = THUMBNAIL_SIZE

            bbox_str = f"{bbox['minx']},{bbox['miny']},{bbox['maxx']},{bbox['maxy']}"
            return (
                f"service=WMS&version=1.1.0&request=GetMap&layers={layer_group_name}"
                f"&bbox={bbox_str}&width={int(width)}&height={int(height)}&srs=EPSG:4326"
                f"&format=image/png"
            )
        else:
            logger.error(f"Failed to get layer group data. Status: {response.status_code}")
            return False

class Names:
    def __init__(self, floodmap_id):
        self.floodmap_id = floodmap_id

    def workspace(self):
        """
        workspace name for the floodmap
        """
        return f'floodmap_{self.floodmap_id}'

    def esa_world_cover(self):
        """
        store, geotiff, and layer names for esa_world_cover
        """
        store = f'esa_world_cover_store_{self.floodmap_id}'
        geotiff = f'esa_world_cover_{self.floodmap_id}.tiff'
        layer = f'esa_world_cover_layer_{self.floodmap_id}'
        return store, geotiff, layer
    
    def s1_backscatter(self):
        """
        store, geotiff, and layer names for s1_backscatter
        """
        store = f's1_backscatter_store_{self.floodmap_id}'
        geotiff = f's1_backscatter_{self.floodmap_id}.tiff'
        layer = f's1_backscatter_layer_{self.floodmap_id}'
        return store, geotiff, layer
    
    def t_score(self):
        """
        store, geotiff, and layer names for t_score
        """
        store = f't_score_store_{self.floodmap_id}'
        geotiff = f't_score_{self.floodmap_id}.tiff'
        layer = f't_score_layer_{self.floodmap_id}'
        return store, geotiff, layer
    
    def flooded_regions(self):
        """
        store, geotiff, and layer names for flooded_regions
        """
        store = f'flooded_regions_store_{self.floodmap_id}'
        geotiff = f'flooded_regions_{self.floodmap_id}.tiff'
        layer = f'flooded_regions_layer_{self.floodmap_id}'
        return store, geotiff, layer

    def thumbnail(self):
        """
        store, geotiff, layer, and layer group name for thumbnail png
        """
        store = f'thumbnail_store_{self.floodmap_id}'
        geotiff = f'thumbnail_{self.floodmap_id}.tiff'
        layer = f'thumbnail_layer_{self.floodmap_id}'
        layer_group = f'thumbnail_layer_group_{self.floodmap_id}'
        return store, geotiff, layer, layer_group

    def data_directory(self):
        """
        name of directory containing geotiffs
        """
        return f'floodmap_{self.floodmap_id}'

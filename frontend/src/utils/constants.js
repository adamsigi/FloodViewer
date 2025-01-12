export const SUCCEEDED_STATUS = 'Succeeded'
export const FAILED_STATUS = 'Failed'
export const PROGRESSING_STATUS = 'Progressing'

export const STAGES = [
    'Pending approval',
    'Waiting in queue',
    'Downloading precipitation data',
    'Downloading Sentinel-1 images',
    'Preprocessing Sentinel-1 images',
    'Performing statistical analysis',
    'Classifying floodwater',
    'Committing results',
    'Completed'
]

export const SHORT_SCREEN_HEIGHT_THRESHOLD = 666


export const RESULTS_PER_PAGE = 12
export const MAX_BBOX_SIDE_DISTANCE = 45  // Km

export const DEFAULT_DAYS_BEFORE_FLOOD = 45
export const DEFAULT_DAYS_AFTER_FLOOD = 4

// ~ Athens
export const INIT_LAT = 37.971
export const INIT_LNG = 23.732
export const INIT_ZOOM = 11

export const Z_INDEXES = {
    Map: 1298,
    OverMap: 1299,
    OverMUIDialogShadow: 1301, // +1 of the z-index of the shadow area of MUI Dialog
    NavBar: 1302
}

export const LC_CATEGORIES = {
    0: "No data",
    10: "Tree cover",
    20: "Shrubland",
    30: "Grassland",
    40: "Cropland",
    50: "Built-up",
    60: "Bare/sparse vegetation",
    70: "Snow and Ice",
    80: "Permanent water bodies",
    90: "Herbaceous wetland",
    95: "Mangroves",
    100: "Moss and lichen"
}

export const LC_COLORBAR = {
    0:   'rgba(0, 0, 0, 0)',
    10:  'rgba(0, 100, 0, 1)',
    20:  'rgba(255, 187, 34, 1)',
    30:  'rgba(255, 255, 76, 1)',
    40:  'rgba(240, 150, 255, 1)',
    50:  'rgba(250, 0, 0, 1)',
    60:  'rgba(180, 180, 180, 1)',
    70:  'rgba(240, 240, 240, 1)',
    80:  'rgba(0, 100, 200, 1)',
    90:  'rgba(0, 150, 160, 1)',
    95:  'rgba(0, 207, 117, 1)',
    100: 'rgba(250, 230, 160, 1)'
}

export const ESA_WORLD_COVER_PANEL_OFFSET = 290
export const S1_BACKSCATTER_COLORMAP_OFFSET = 82
export const MAP_ATTRIBUTION_OFFSET = 28

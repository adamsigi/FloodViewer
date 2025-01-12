import { WMSTileLayer } from 'react-leaflet/WMSTileLayer'
import { Rectangle } from 'react-leaflet/Rectangle'
import { useMemo } from 'react'

const VITE_GEOSERVER_URL = import.meta.env.VITE_GEOSERVER_URL

export default function MapLayers({ floodmap, visibleLayers }) {
    const wmsUrl = `${VITE_GEOSERVER_URL}/geoserver/${floodmap.product.geoserver_workspace}/wms?`

    // Need to memoise params
    const esaWorldCoverParams = useMemo(() => {
        return {
            layers: `${floodmap.product.geoserver_workspace}:${floodmap.product.esa_world_cover_layer}`,
            format: 'image/png',
            transparent: true,
            updateWhenZooming: false,
            updateWhenIdle: true,
            bounds: [
                [floodmap.bbox.min_lat, floodmap.bbox.min_lng],
                [floodmap.bbox.max_lat, floodmap.bbox.max_lng]
            ]
        }
    }, [floodmap])

    const s1BackscatterParams = useMemo(() => {
        return {
            layers: `${floodmap.product.geoserver_workspace}:${floodmap.product.s1_backscatter_layer}`,
            format: 'image/png',
            transparent: true,
            updateWhenZooming: false,
            updateWhenIdle: true,
            bounds: [
                [floodmap.bbox.min_lat, floodmap.bbox.min_lng],
                [floodmap.bbox.max_lat, floodmap.bbox.max_lng]
            ]
        }
    }, [floodmap])

    const tScoreParams = useMemo(() => {
        return {
            layers: `${floodmap.product.geoserver_workspace}:${floodmap.product.t_score_layer}`,
            format: 'image/png',
            transparent: true,
            updateWhenZooming: false,
            updateWhenIdle: true,
            bounds: [
                [floodmap.bbox.min_lat, floodmap.bbox.min_lng],
                [floodmap.bbox.max_lat, floodmap.bbox.max_lng]
            ]
        }
    }, [floodmap])

    const floodedRegionsParams = useMemo(() => {
        return {
            layers: `${floodmap.product.geoserver_workspace}:${floodmap.product.flooded_regions_layer}`,
            format: 'image/png',
            transparent: true,
            updateWhenZooming: false,
            updateWhenIdle: true,
            bounds: [
                [floodmap.bbox.min_lat, floodmap.bbox.min_lng],
                [floodmap.bbox.max_lat, floodmap.bbox.max_lng]
            ]
        }
    }, [floodmap])

    return (
        <>
            {visibleLayers.aoi &&
                <Rectangle
                    bounds={[
                        [floodmap.bbox.min_lat, floodmap.bbox.min_lng],
                        [floodmap.bbox.max_lat, floodmap.bbox.max_lng]
                    ]}
                />
            }

            {visibleLayers.esaWorldCover &&
                <WMSTileLayer
                    url={wmsUrl}
                    params={esaWorldCoverParams}
                />
            }

            {visibleLayers.s1Backscatter &&
                <WMSTileLayer
                    url={wmsUrl}
                    params={s1BackscatterParams}
                />
            }

            {visibleLayers.tScore &&
                <WMSTileLayer
                    url={wmsUrl}
                    params={tScoreParams}
                />
            }

            {visibleLayers.floodedRegions &&
                <WMSTileLayer
                    url={wmsUrl}
                    params={floodedRegionsParams}
                    zIndex={2}
                    
                />
            }
        </>
    )
}

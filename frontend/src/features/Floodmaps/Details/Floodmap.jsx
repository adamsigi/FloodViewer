import 'leaflet/dist/leaflet.css'  // Required for leaflet to work!
import { useEffect, useState } from "react"
import { useLoaderData, useNavigate, useParams } from "react-router-dom"
import Box from "@mui/material/Box"
import Fab from "@mui/material/Fab"
import LayersIcon from '@mui/icons-material/Layers'
import useMediaQuery from "@mui/material/useMediaQuery"
import { MapContainer } from 'react-leaflet/MapContainer'
import { TileLayer } from 'react-leaflet/TileLayer'
import { Z_INDEXES } from "@utils/constants"
import { ESA_WORLD_COVER_PANEL_OFFSET, MAP_ATTRIBUTION_OFFSET, S1_BACKSCATTER_COLORMAP_OFFSET } from '@utils/constants'
import useScreenHeightThreshold from "@hooks/useScreenHeightThreshold"
import { SUCCEEDED_STATUS, PROGRESSING_STATUS, STAGES } from "@utils/constants"
import JobProgress from "./JobProgress"
import { FloodmapInfoCompact, FloodmapInfoFull } from "./FloodmapInfo"
import LayersControl from "./LayersControl"
import MapLayers from "./MapLayers"
import EsaWorldCoverCategories from "./legends/EsaWorldCoverCategories"
import BackscatterColormap from "./legends/BackscatterColormap"
import TScoreColormap from "./legends/TScoreColormap"
import AdminApprovalPanel from "./AdminApprovalPanel"


const VITE_BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL

export default function FloodMap() {
    let { floodmapId } = useParams()
    const floodmap = useLoaderData()  // error cases are handled in the router
    const [lastJobUpdate, setLastJobUpdate] = useState(floodmap.job)
    const isNotExtraSmallScreen = useMediaQuery(theme => theme.breakpoints.up('sm'))
    const isShortScreen = useScreenHeightThreshold()
    const navigate = useNavigate()
    const [showLayersControl, setShowLayersControl] = useState(!isShortScreen)
    const [visibleLayers, setVisibleLayers] = useState({
        aoi: true,
        esaWorldCover: false,
        s1Backscatter: false,
        tScore: false,
        floodedRegions: true
    })

    useEffect(() => {
        // Request job updates only if the job is in progress.
        if (floodmap.job.status !== PROGRESSING_STATUS) {
            return
        }
        const socket = new WebSocket(`${VITE_BACKEND_WS_URL}/ws/api/floodmaps/${floodmapId}/updates/`)

        socket.addEventListener("message", (event) => {
            const jobUpdate = JSON.parse(event.data)
            setLastJobUpdate(currLastJobUpdate => ({ ...currLastJobUpdate, ...jobUpdate }))

            if (jobUpdate.status !== PROGRESSING_STATUS) {
                socket.close()
            }
            if (jobUpdate.status === SUCCEEDED_STATUS) {
                navigate(".", { relative: "path", replace: true })
            }
        })
        return () => {
            socket.close()
        }

    }, [floodmapId, floodmap.job.status, navigate])


    return (
        <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'start' }}>
            <MapContainer
                style={{ zIndex: Z_INDEXES.Map, flex: 1, width: '100%' }}
                bounds={[[floodmap.bbox.max_lat, floodmap.bbox.min_lng], [floodmap.bbox.min_lat, floodmap.bbox.max_lng]]}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {floodmap.job.status === SUCCEEDED_STATUS &&
                    <MapLayers floodmap={floodmap} visibleLayers={visibleLayers} />
                }
            </MapContainer>

            {isNotExtraSmallScreen && !isShortScreen ?
                <Box sx={{ position: 'absolute', top: 0, m: 1, }}>
                    <FloodmapInfoFull floodmap={floodmap} />
                </Box>
                :
                (!isShortScreen &&
                    <Box sx={{ position: 'absolute', top: 0, display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <FloodmapInfoCompact floodmap={floodmap} />
                    </Box>
                )
            }

            {floodmap.job.status !== SUCCEEDED_STATUS ?
                (
                    <>
                        <JobProgress lastJobUpdate={lastJobUpdate} />
                        {floodmap.owned && lastJobUpdate.stage === STAGES[0] && lastJobUpdate.status === PROGRESSING_STATUS && !isShortScreen &&
                            <Box sx={{ position: 'absolute', bottom: 2, display: 'flex', justifyContent: 'start', width: '100%' }}>
                                <AdminApprovalPanel />
                            </Box>
                        }
                    </>
                ) :
                (
                    <>
                        {showLayersControl && !isShortScreen &&
                            <Box sx={{ position: 'absolute', bottom: isNotExtraSmallScreen ? 2 : 10, display: 'flex', justifyContent: isNotExtraSmallScreen ? 'start' : 'center', width: '100%' }}>
                                <LayersControl visibleLayers={visibleLayers} setVisibleLayers={setVisibleLayers} />
                            </Box>
                        }

                        {!isNotExtraSmallScreen && !isShortScreen &&
                            <Box sx={{ position: 'absolute', bottom: 1, left: 1, m: 2, }}>
                                <Fab color={showLayersControl ? 'primary' : 'default'} size='small' aria-label="edit-location-panel" sx={{ zIndex: Z_INDEXES.OverMap, }} onClick={() => setShowLayersControl(!showLayersControl)}>
                                    <LayersIcon sx={(theme) => ({ color: showLayersControl ? 'default' : theme.palette.primary.main })} data-testid='layers-control-toggle' />
                                </Fab>
                            </Box>
                        }

                        {isNotExtraSmallScreen && visibleLayers.esaWorldCover &&
                            <Box sx={{ position: 'absolute', bottom: 19, right: 1, }}>
                                <EsaWorldCoverCategories landCoverCategories={floodmap.product.land_cover_categories} />
                            </Box>
                        }

                        {isNotExtraSmallScreen && visibleLayers.s1Backscatter &&
                            <Box sx={{
                                position: 'absolute',
                                bottom: visibleLayers.esaWorldCover ? MAP_ATTRIBUTION_OFFSET + ESA_WORLD_COVER_PANEL_OFFSET : MAP_ATTRIBUTION_OFFSET,
                                right: 1,
                            }}>
                                <BackscatterColormap s1BackscatterQuantiles={floodmap.product.s1_backscatter_quantiles} />
                            </Box>
                        }

                        {isNotExtraSmallScreen && visibleLayers.tScore &&
                            <Box sx={{
                                position: 'absolute',
                                bottom: visibleLayers.esaWorldCover ?
                                    (visibleLayers.s1Backscatter ?
                                        S1_BACKSCATTER_COLORMAP_OFFSET + ESA_WORLD_COVER_PANEL_OFFSET
                                        : MAP_ATTRIBUTION_OFFSET + ESA_WORLD_COVER_PANEL_OFFSET)
                                    : (visibleLayers.s1Backscatter ?
                                        S1_BACKSCATTER_COLORMAP_OFFSET
                                        : MAP_ATTRIBUTION_OFFSET),
                                right: 1,
                            }}>
                                <TScoreColormap tScoreQuantiles={floodmap.product.t_score_quantiles} />
                            </Box>
                        }
                    </>
                )}
        </Box>
    )
}

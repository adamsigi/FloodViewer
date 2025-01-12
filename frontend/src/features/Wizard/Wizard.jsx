import 'leaflet/dist/leaflet.css'
import { MapContainer } from 'react-leaflet/MapContainer'
import { TileLayer } from 'react-leaflet/TileLayer'
import { useCallback, useRef, useState } from 'react'
import { point, distance } from '@turf/turf'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import useMediaQuery from '@mui/material/useMediaQuery'
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt'
import BBoxEditor from './BBoxEditor'
import FloodInfoForm from './FloodInfoForm'
import LocationSearch from './LocationSearch'
import AreaSelect from './AreaSelect'
import HelpTooltip from '@components/HelpTooltip'
import { desktopSteps, mobileSteps } from './wizardSteps'
import { FullStepper, CompactStepper, MinimalStepper } from './Steppers'
import useScreenHeightThreshold from '@hooks/useScreenHeightThreshold'
import { INIT_LAT, INIT_LNG, MAX_BBOX_SIDE_DISTANCE, Z_INDEXES, INIT_ZOOM } from '@utils/constants'

export default function Wizard() {
    const [activeStep, setActiveStep] = useState(0)
    const [leafletMap, setLeafletMap] = useState(null)
    const [bBox, setBBox] = useState({ min_lat: '0', min_lng: '0', max_lat: '0', max_lng: '0' })
    const [error, setError] = useState('')
    const isLargeScreen = useMediaQuery(theme => theme.breakpoints.up('lg'))
    const isShortScreen = useScreenHeightThreshold()
    const [showEditBBoxPanel, setShowEditBBoxPanel] = useState(isLargeScreen)
    const areaSelectRef = useRef()
    // Need to keep track of the shape of the area select box in case the user leaves and
    // reenters the second step.
    const areaSelectDimensionsRef = useRef({ height: 180, width: 320 })

    function checkBBoxSize(minLat, minLng, maxLat, maxLng) {
        const verticalDistance = distance(
            point([maxLng, minLat]),
            point([maxLng, maxLat]),
            { units: 'kilometers' }
        )
        const horizontalDistance = distance(
            point([minLng, minLat]),
            point([maxLng, minLat]),
            { units: 'kilometers' }
        )
        if (verticalDistance > MAX_BBOX_SIDE_DISTANCE && horizontalDistance > MAX_BBOX_SIDE_DISTANCE) {
            setError(`The vertical and horizontal distances are ${verticalDistance.toFixed(0)}km and ${horizontalDistance.toFixed(0)}km 
            respectively and they must not exceed ${MAX_BBOX_SIDE_DISTANCE}km!`)
        }
        else if (verticalDistance > MAX_BBOX_SIDE_DISTANCE) {
            setError(`The vertical distance is ${verticalDistance.toFixed(0)}km and it must not exceed ${MAX_BBOX_SIDE_DISTANCE}km!`)
        }
        else if (horizontalDistance > MAX_BBOX_SIDE_DISTANCE) {
            setError(`The horizontal distance is ${horizontalDistance.toFixed(0)}km and it must not exceed ${MAX_BBOX_SIDE_DISTANCE}km!`)
        }
        else {
            setError('')
        }
    }

    const handleChangeMapView = useCallback((bounds, dimensions) => {
        // Update BBox data when the map view, i.e. the displayed area, changes.
        const [minLat, minLng, maxLat, maxLng] = [
            bounds._southWest.lat.toFixed(3),
            bounds._southWest.lng.toFixed(3),
            bounds._northEast.lat.toFixed(3),
            bounds._northEast.lng.toFixed(3)
        ]
        checkBBoxSize(minLat, minLng, maxLat, maxLng)
        setBBox({
            min_lat: minLat,
            min_lng: minLng,
            max_lat: maxLat,
            max_lng: maxLng
        })
        areaSelectDimensionsRef.current = dimensions
    }, [])

    return (
        <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'start' }}>
            <MapContainer center={[INIT_LAT, INIT_LNG]} zoom={INIT_ZOOM} style={{ zIndex: Z_INDEXES.Map, flex: 1, width: '100%' }} zoomControl={false} minZoom={3} maxZoom={18} ref={setLeafletMap}>
                <TileLayer
                    attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {activeStep === 1 &&
                    <AreaSelect onChangeMapView={handleChangeMapView} areaSelectDimensionsRef={areaSelectDimensionsRef} ref={areaSelectRef} />
                }
            </MapContainer>

            {isLargeScreen ? (
                <Box sx={{ position: 'absolute', top: 0, }}>
                    <FullStepper steps={desktopSteps} activeStep={activeStep} setActiveStep={setActiveStep} error={error} setError={setError} />
                </Box>
            ) : (
                <>
                    <Box sx={{ position: 'absolute', top: 0, display: 'flex', justifyContent: 'center', width: '100%' }}>
                        {!isShortScreen ?
                            <CompactStepper steps={mobileSteps} activeStep={activeStep} setActiveStep={setActiveStep} error={error} setError={setError} />
                            :
                            <MinimalStepper steps={mobileSteps} activeStep={activeStep} setActiveStep={setActiveStep} error={error} setError={setError} />
                        }
                    </Box>
                    {activeStep < mobileSteps.length &&
                        <Box sx={{ position: 'absolute', bottom: 18, right: 3, m: 1 }}>
                            <HelpTooltip message={mobileSteps[activeStep].description} />
                        </Box>
                    }
                    {activeStep === 1 && !isShortScreen &&
                        <Box sx={{ position: 'absolute', bottom: 1, left: 1, m: 2, }}>
                            <Fab color={showEditBBoxPanel ? 'default' : 'primary'} size='small' aria-label="edit-location-panel" sx={{ zIndex: Z_INDEXES.OverMap, }} onClick={() => setShowEditBBoxPanel(!showEditBBoxPanel)}>
                                <EditLocationAltIcon sx={(theme) => ({ color: showEditBBoxPanel ? theme.palette.primary.main : 'default' })} />
                            </Fab>
                        </Box>
                    }
                </>
            )}
            {activeStep === 0 &&
                <Box sx={{ position: 'absolute', bottom: 24, display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <LocationSearch leafletMap={leafletMap} />
                </Box>
            }

            {activeStep === 1 && !isShortScreen && showEditBBoxPanel &&
                <Box sx={{ position: 'absolute', bottom: isLargeScreen ? 2 : 10, display: 'flex', justifyContent: isLargeScreen ? 'start' : 'center', width: '100%' }}>
                    <BBoxEditor bBox={bBox} setBBox={setBBox} areaSelectRef={areaSelectRef} />
                </Box>
            }

            {activeStep === 2 &&
                <FloodInfoForm bBox={bBox} activeStep={activeStep} setActiveStep={setActiveStep} setError={setError} isShortScreen={isShortScreen} />
            }

        </Box >
    )
}

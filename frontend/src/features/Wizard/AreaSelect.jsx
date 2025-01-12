import { useMap } from 'react-leaflet/hooks'
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react"
import '@jonatanheyman/leaflet-areaselect/src/leaflet-areaselect'
import '@jonatanheyman/leaflet-areaselect/src/leaflet-areaselect.css'

const AreaSelect = forwardRef(({ onChangeMapView, areaSelectDimensionsRef }, ref) => {
    const map = useMap()
    const areaSelectRef = useRef(null)

    useImperativeHandle(ref, () => ({
        getAreaSelect: () => areaSelectRef.current,  // Expose the areaSelect instance via ref
    }))


    useEffect(() => {
        if (!map) return

        const areaSelect = window.L.areaSelect(areaSelectDimensionsRef.current)

        areaSelect.addTo(map)

        // Listen for change events
        areaSelect.on('change', function () {
            const bounds = areaSelect.getBounds()
            const dimensions = areaSelect.getDimensions()
            onChangeMapView && onChangeMapView(bounds, dimensions)
        })

        onChangeMapView(areaSelect.getBounds(), areaSelect.getDimensions())

        areaSelectRef.current = areaSelect
        
        return () => {
            areaSelect.off('change')
            areaSelect.remove()
        }
    }, [map, onChangeMapView, areaSelectDimensionsRef])

    return null
})

AreaSelect.displayName = 'AreaSelect'
export default AreaSelect
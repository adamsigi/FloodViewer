import {  useMap } from "react-leaflet"

export default function SetMapBounds({ bbox }) {
    const map = useMap()
    map.fitBounds([
        [bbox.min_lat, bbox.min_lng],
        [bbox.max_lat, bbox.max_lng]
    ])
    return null
}

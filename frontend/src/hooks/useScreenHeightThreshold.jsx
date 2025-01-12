import { useEffect, useState } from "react"
import { SHORT_SCREEN_HEIGHT_THRESHOLD } from "../utils/constants"


export default function useScreenHeightThreshold(threshold=SHORT_SCREEN_HEIGHT_THRESHOLD) {
    const [isBelowThreshold, setIsBelowThreshold] = useState(window.innerHeight < threshold)

    useEffect(() => {
        function handleResize() {
            setIsBelowThreshold(window.innerHeight < threshold)
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [threshold])

    return isBelowThreshold
}

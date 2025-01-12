import Box from '@mui/material/Box'
import { useFetcher, } from 'react-router-dom'
import FloodmapFiltersBar from './FloodmapFiltersBar'
import FloodmapsDisplay from './FloodmapsDisplay'

export default function UserFloodmaps() {
    const fetcher = useFetcher()

    return (
        <Box sx={{ flex: 1, mx: { xs: 3, md: 6, lg: 10, xl: 18 }, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <FloodmapFiltersBar fetcher={fetcher} />
            <FloodmapsDisplay fetcher={fetcher} />
        </Box >
    )
}

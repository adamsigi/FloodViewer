import Box from '@mui/material/Box'
import FloodmapSearchBar from './FloodmapSearchBar'
import FloodmapsDisplay from './FloodmapsDisplay'
import { useFetcher } from 'react-router-dom'

export default function PublicFloodmaps() {
    const fetcher = useFetcher()

    return (
        <Box sx={{ flex: 1, mx: { xs: 3, md: 6, lg: 10, xl: 18 }, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <FloodmapSearchBar fetcher={fetcher} />
            <FloodmapsDisplay fetcher={fetcher} />
        </Box >
    )
}

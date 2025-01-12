import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import FloodmapCard from './FloodmapCard'
import { useLoaderData } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import { RESULTS_PER_PAGE } from '@utils/constants'
import useSearchParamsNoReload from '@hooks/useSearchParamsNoReload'
import Pagination from '@mui/material/Pagination'

// Needs the fetcher to read state and get next page.
export default function FloodmapsDisplay({ fetcher }) {
    let floodmapListResponse = useLoaderData()
    const [getSearchParamsNoReload, setSearchParamsNoReload] = useSearchParamsNoReload()

    let floodmapList = floodmapListResponse.results
    let floodmapCount = floodmapListResponse.count
    // Fetcher is used to avoid reloading the page on search.
    // If the page is reloaded the default loading component covers everything other that the nav bar
    // (including the server options).
    // Instead use the state from fetcher to only cover the area where the floodmap cards are displayed.
    if (fetcher.data !== undefined) {
        floodmapList = fetcher.data.results
        floodmapCount = fetcher.data.count
    }
    const numberOfPages = Math.ceil(floodmapCount / RESULTS_PER_PAGE)
    const activePage = parseInt(getSearchParamsNoReload('page') || '1')

    function handlePageChange(event, value) {
        setSearchParamsNoReload({ 'page': value }, true)
        fetcher.load(getSearchParamsNoReload())
    }

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, }}>
            {fetcher.state === 'loading' ?
                (
                    <Stack justifyContent='center' alignItems='center' sx={{ flex: 1 }}>
                        <CircularProgress color='primary' size='6rem' sx={{ opacity: 0.5, }} />
                    </Stack>
                ) :
                floodmapList.length === 0 ?
                    (
                        <Stack direction='column' justifyContent='center' sx={{ flex: 1, mb: 8 }}>
                            <Typography variant='h4' sx={{ opacity: 0.6, textAlign: 'center' }}>No floodmaps were found.</Typography>
                        </Stack>
                    ) :
                    (
                        <Stack direction='column' justifyContent='space-between' sx={{ flex: 1 }} >
                            <Grid container spacing={1} >
                                {floodmapList.map(floodmap => (
                                    <Grid key={floodmap.id} item xs={12} md={6} lg={4} xl={3}>
                                        <FloodmapCard floodmap={floodmap} />
                                    </Grid>
                                ))}

                            </Grid>
                            {numberOfPages > 1 &&
                                <Stack justifyContent='center' alignItems='center' sx={{ pb: 2, pt: 1 }}>
                                    <Pagination color='primary' page={activePage} count={numberOfPages} onChange={handlePageChange} />
                                </Stack>
                            }
                        </Stack>
                    )
            }
        </Box >
    )
}

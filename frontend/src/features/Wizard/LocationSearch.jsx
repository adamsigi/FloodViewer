import { useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import useScreenHeightThreshold from "@hooks/useScreenHeightThreshold"
import { Z_INDEXES } from '@utils/constants'



export default function LocationSearch({ leafletMap }) {
    const [searchPattern, setSearchPattern] = useState('')
    const [disableSearch, setDisableSearch] = useState(true)
    const [disableInput, setDisableInput] = useState(false)
    const [searchResults, setSearchResults] = useState(null)
    const displayLocationsCount = useScreenHeightThreshold() ? 2 : 3

    function handleChange(event) {
        if (event.target.value.length >= 3) {
            setDisableSearch(false)
        }
        else {
            setDisableSearch(true)
        }
        setSearchPattern(event.target.value)
        setSearchResults(null)
    }

    function handleSearch() {
        setDisableSearch(true)
        setDisableInput(true)
        const geocoding_endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchPattern)}`
        fetch(geocoding_endpoint)
            .then(response => response.json())
            .then(data => {
                setSearchResults(data.slice(0, displayLocationsCount))
            })
            .finally(() => {
                setDisableSearch(false)
                setDisableInput(false)
            })
    }

    function mapVisit(searchResult) {
        const lat = parseFloat(searchResult.lat)
        const lng = parseFloat(searchResult.lon)
        leafletMap.setView([lat, lng], 13)
    }

    return (
        <Box sx={{ maxWidth: 270, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, zIndex: Z_INDEXES.OverMap, }} >
            {searchResults &&
                <Stack direction='column' sx={{ gap: 0.5, alignItems: 'center', }} >
                    {searchResults.length === 0 &&
                        <Typography sx={(theme) => ({
                            overflow: 'hidden', minWidth: 270, maxHeight: 60, p: '4px', border: 'solid',
                            borderRadius: 9, borderColor: theme.palette.primary.main, borderWidth: 1, color: 'grey',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)', px: 1,
                        })} >
                            Nothing found..
                        </Typography>

                    }
                    {searchResults.map(searchResult =>
                        <Typography key={searchResult.place_id}
                            onClick={() => mapVisit(searchResult)}
                            sx={(theme) => ({
                                overflow: 'hidden', minWidth: 270, maxHeight: 60, p: '4px', border: 'solid', borderRadius: 9,
                                borderColor: theme.palette.primary.main, borderWidth: 1, color: theme.palette.primary.main,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)', px: 2,
                                '&:hover': { textDecoration: 'underline', cursor: 'pointer' }
                            })} >
                            {searchResult.display_name}
                        </Typography>
                    )}
                </Stack>
            }
            <Stack direction='row' sx={{ gap: 1, alignItems: 'center' }} >
                <Box sx={(theme) => ({
                    maxWidth: '240px', display: 'flex', alignItems: 'center', p: 1, border: 'solid', borderRadius: 9, borderWidth: 1,
                    '&:focus-within': { borderWidth: 2 }, borderColor: theme.palette.primary.main, backgroundColor: 'rgba(255, 255, 255, 0.8)'
                })}>
                    <TextField
                        id="search_location"
                        placeholder="Search location"
                        name="search_location"
                        type="search"
                        variant="standard"
                        size='small'
                        autoComplete='true'
                        value={searchPattern}
                        onChange={handleChange}
                        onKeyDown={(event) => { event.key == 'Enter' && handleSearch() }}
                        sx={{
                            flex: 1, mx: 2, minWidth: '150px',
                        }}
                        disabled={disableInput}
                    />
                </Box>

                <IconButton
                    type="submit"
                    sx={(theme) => ({
                        width: '45px', height: '45px', p: 1, border: 'solid', borderColor: theme.palette.primary.main,
                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': { backgroundColor: 'rgba(235, 235, 235, 1)' }, borderWidth: 2,
                        '&.Mui-disabled': {
                            backgroundColor: 'lightgrey',
                            opacity: 0.5,
                        },
                    })}
                    aria-label="search"
                    onClick={handleSearch}
                    disabled={disableSearch}
                >
                    <SearchIcon color='primary' />
                </IconButton>
            </Stack>
        </Box>
    )
}

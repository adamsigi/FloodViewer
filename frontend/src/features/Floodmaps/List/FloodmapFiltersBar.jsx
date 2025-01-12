import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Stack from '@mui/material/Stack'
import { useState } from 'react'
import useSearchParamsNoReload from '@hooks/useSearchParamsNoReload'

// Needs the fetcher to get floodmaps once filters are applied.
export default function FloodmapFiltersBar({ fetcher }) {
    const [getSearchParamsNoReload, setSearchParamsNoReload] = useSearchParamsNoReload()
    const [filters, setFilters] = useState({
        succeeded: getSearchParamsNoReload('succeeded') !== 'false',
        progressing: getSearchParamsNoReload('progressing') !== 'false',
        failed: getSearchParamsNoReload('failed') !== 'false'
    })

    function handleFilterToggle(event) {
        const { name, checked } = event.target
        const nextFilters = { ...filters, [name]: checked }
        setFilters(nextFilters)
        setSearchParamsNoReload(nextFilters)
        fetcher.load(getSearchParamsNoReload())
    }

    return (
        <Stack direction='row' gap={1.0} justifyContent='center' sx={{ mt: 1 }}>
            <FormGroup row={true} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0px 8px' }}>
                <FormControlLabel
                    control={<Checkbox checked={filters.succeeded} disabled={fetcher.state === 'loading'} />}
                    name="succeeded"
                    label="Succeeded"
                    onChange={handleFilterToggle}
                />
                <FormControlLabel
                    control={<Checkbox checked={filters.progressing} disabled={fetcher.state === 'loading'} />}
                    name="progressing"
                    label="Progressing"
                    onChange={handleFilterToggle}
                />
                <FormControlLabel
                    control={<Checkbox checked={filters.failed} disabled={fetcher.state === 'loading'} />}
                    name="failed"
                    label="Failed"
                    onChange={handleFilterToggle}
                />
            </FormGroup>
        </Stack>
    )
}

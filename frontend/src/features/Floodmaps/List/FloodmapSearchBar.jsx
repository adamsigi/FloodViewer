import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { Controller, TextFieldElement, useForm, } from 'react-hook-form-mui'
import { yupResolver } from "@hookform/resolvers/yup"
import Stack from '@mui/material/Stack'
import SearchIcon from '@mui/icons-material/Search'
import TuneIcon from '@mui/icons-material/Tune'
import IconButton from '@mui/material/IconButton'
import { TextFieldElementNoArrows } from '@components/StyledElements'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { floodListFiltersSchema } from '@utils/validationSchemas'
import dayjs from 'dayjs'
import useSearchParamsNoReload from '@hooks/useSearchParamsNoReload'

const filterTypes = { name: 'NAME', area: 'AREA', date: 'DATE' }

export default function FloodmapSearchBar({ fetcher }) {
    const [displayedFilter, setDisplayedFilter] = useState(filterTypes.name)
    const [showFilterOptions, setShowFilterOptions] = useState(false)
    const [getSearchParamsNoReload, setSearchParamsNoReload] = useSearchParamsNoReload()

    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(floodListFiltersSchema),
        reValidateMode: 'onSubmit',
        defaultValues: {
            flood_name: getSearchParamsNoReload('flood_name'),
            max_lat: getSearchParamsNoReload('max_lat'),
            min_lat: getSearchParamsNoReload('min_lat'),
            max_lng: getSearchParamsNoReload('max_lng'),
            min_lng: getSearchParamsNoReload('min_lng'),
            from_date: getSearchParamsNoReload('from_date') ? dayjs(getSearchParamsNoReload('from_date'), "DD/MM/YYYY") : null,
            to_date: getSearchParamsNoReload('to_date') ? dayjs(getSearchParamsNoReload('to_date'), "DD/MM/YYYY") : null,
        },
    })

    function submitWithoutEmptyParams(event) {
        if (fetcher.state !== 'idle') {  // avoid spamming/queueing requests
            return
        }
        const formData = new FormData(event.target)
        const params = {}
        for (const [key, value] of formData.entries()) {
            if (value) {
                params[key] = value
            }
        }
        const paramsChanged = setSearchParamsNoReload(params)
        if (paramsChanged) {
            fetcher.load(getSearchParamsNoReload())
        }
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
            <Box
                component='form'
                method="get"
                onSubmit={handleSubmit((_, event) => submitWithoutEmptyParams(event))}
                sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px 30px', justifyContent: 'center', alignItems: 'center', width: '80%', m: 1.4 }}
            >
                <Stack direction='row' gap={1.5} alignItems='center'>
                    <Box sx={(theme) => ({
                        maxWidth: '240px', display: 'flex', alignItems: 'center', p: 1, border: 'solid', borderRadius: 7, borderWidth: 1,
                        '&:focus-within': { borderWidth: 2 }, borderColor: theme.palette.primary.main,
                    })}>
                        <Stack direction='row' sx={{ display: displayedFilter === filterTypes.name ? 'flex' : 'none' }}>
                            <TextFieldElement
                                id="flood_name"
                                placeholder="Flood name"
                                name="flood_name"
                                type="search"
                                control={control}
                                variant="standard"
                                size='small'
                                autoComplete='true'
                                sx={{
                                    flex: 1, mx: 2, minWidth: '150px',
                                }}
                            />
                        </Stack>

                        <Stack direction='column' sx={{ display: displayedFilter === filterTypes.area ? 'flex' : 'none' }}>
                            <Stack direction='row'>
                                <TextFieldElementNoArrows
                                    id="max_lat"
                                    placeholder="Max Lat."
                                    name="max_lat"
                                    type="number"
                                    control={control}
                                    variant="standard"
                                    size='small'
                                    sx={{
                                        flex: 1, ml: 2, mr: 2, minWidth: '60px',
                                    }}
                                />
                                <TextFieldElementNoArrows
                                    id="min_lat"
                                    placeholder="Min Lat."
                                    name="min_lat"
                                    type="number"
                                    control={control}
                                    variant="standard"
                                    size='small'
                                    sx={{
                                        flex: 1, mr: 2, minWidth: '60px'
                                    }}
                                />
                            </Stack>
                            <Stack direction='row' sx={{ mt: '4px' }}>
                                <TextFieldElementNoArrows
                                    id="max_lng"
                                    placeholder="Max Lng."
                                    name="max_lng"
                                    type="number"
                                    control={control}
                                    variant="standard"
                                    size='small'
                                    sx={{
                                        flex: 1, ml: 2, mr: 2, minWidth: '60px'
                                    }}
                                />
                                <TextFieldElementNoArrows
                                    id="min_lng"
                                    placeholder="Min Lng."
                                    name="min_lng"
                                    type="number"
                                    control={control}
                                    variant="standard"
                                    size='small'
                                    sx={{
                                        flex: 1, mr: 2, minWidth: '60px'
                                    }}
                                />
                            </Stack>
                        </Stack>

                        <Stack direction='column' sx={{ display: displayedFilter === filterTypes.date ? 'flex' : 'none', ml: 2, mr: 2, }}>
                            <Controller
                                control={control}
                                name="from_date"
                                render={({ field }) => {
                                    return (
                                        <DatePicker
                                            id="from_date"
                                            name="from_date"
                                            value={field.value}
                                            inputRef={field.ref}
                                            onChange={(date) => {
                                                field.onChange(date)
                                            }}
                                            format="DD/MM/YYYY"
                                            sx={{
                                                flex: 1, minWidth: '90px', maxWidth: '200px',
                                            }}
                                            slotProps={{
                                                textField: {
                                                    variant: "standard",
                                                    fullWidth: true,
                                                    required: false,
                                                    size: 'small',
                                                    placeholder: "From date",
                                                    error: !!errors.from_date,
                                                    helperText: errors.from_date?.message,
                                                }
                                            }}
                                        />
                                    )
                                }}
                            />
                            <Controller
                                control={control}
                                name="to_date"
                                render={({ field }) => {
                                    return (
                                        <DatePicker
                                            id="to_date"
                                            name="to_date"
                                            value={field.value}
                                            inputRef={field.ref}
                                            onChange={(date) => {
                                                field.onChange(date)
                                            }}
                                            format="DD/MM/YYYY"
                                            sx={{
                                                flex: 1, mt: '4px', minWidth: '90px', maxWidth: '200px',
                                            }}
                                            slotProps={{
                                                textField: {
                                                    variant: "standard",
                                                    fullWidth: true,
                                                    required: false,
                                                    size: 'small',
                                                    placeholder: "To date",
                                                    error: !!errors.to_date,
                                                    helperText: errors.to_date?.message,
                                                }
                                            }}
                                        />
                                    )
                                }}
                            />
                        </Stack>

                    </Box>

                    <IconButton
                        type="submit"
                        sx={(theme) => ({
                            width: '45px', height: '45px', p: 1, border: 'solid 2px', borderColor: theme.palette.primary.main,
                            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
                        })}
                        aria-label="search"
                    >
                        <SearchIcon color='primary' />
                    </IconButton>

                    <IconButton
                        type="button"
                        sx={{
                            width: '45px', height: '45px', p: 1,
                        }}
                        aria-label="filters"
                        onClick={() => setShowFilterOptions(!showFilterOptions)}
                    >
                        <TuneIcon color='primary' />
                    </IconButton>
                </Stack>

                {showFilterOptions &&
                    <Stack direction='row' gap={1.0}>
                        <Button
                            size='large'
                            disableRipple={true}
                            sx={{ borderRadius: 10 }}
                            variant={displayedFilter === filterTypes.name ? 'contained' : 'outlined'}
                            onClick={() => setDisplayedFilter(filterTypes.name)}
                            aria-label={filterTypes.name}
                        >{filterTypes.name}</Button>

                        <Button
                            size='large'
                            disableRipple={true}
                            sx={{ borderRadius: 10 }}
                            variant={displayedFilter === filterTypes.area ? 'contained' : 'outlined'}
                            onClick={() => setDisplayedFilter(filterTypes.area)}
                            aria-label={filterTypes.area}
                        >{filterTypes.area}</Button>

                        <Button
                            size='large'
                            disableRipple={true}
                            sx={{ borderRadius: 10 }}
                            variant={displayedFilter === filterTypes.date ? 'contained' : 'outlined'}
                            onClick={() => setDisplayedFilter(filterTypes.date)}
                            aria-label={filterTypes.date}
                        >{filterTypes.date}</Button>
                    </Stack>
                }
            </Box>
        </Box>
    )
}

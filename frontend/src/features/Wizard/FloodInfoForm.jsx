import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Stack'
import DialogTitle from '@mui/material/DialogTitle'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import { TextFieldElementNoArrows } from '@components/StyledElements'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { floodInfoSchema } from '@utils/validationSchemas'
import { useForm, Controller, TextFieldElement } from 'react-hook-form-mui'
import { yupResolver } from "@hookform/resolvers/yup"
import HelpAccordion from '@components/HelpAccordion'
import dayjs from 'dayjs'
import { useFetcher } from 'react-router-dom'
import { useEffect } from 'react'
import useScreenHeightThreshold from '@hooks/useScreenHeightThreshold'
import DimBox from '@components/DimBox'
import { DEFAULT_DAYS_BEFORE_FLOOD, DEFAULT_DAYS_AFTER_FLOOD } from '@utils/constants'

export default function FloodInfoForm({ bBox, setActiveStep, setError }) {
    const fetcher = useFetcher()
    const isShortScreen = useScreenHeightThreshold()
    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(floodInfoSchema),
        defaultValues: {
            flood_name: null,
            flood_datetime: null,
            days_before_flood: DEFAULT_DAYS_BEFORE_FLOOD,
            days_after_flood: DEFAULT_DAYS_AFTER_FLOOD,
        },
    })

    function performSubmit(info) {
        const body = {
            "name": info.flood_name,
            "bbox": bBox,
            "flood_date": dayjs(info.flood_datetime).format('YYYY-MM-DDTHH:mm:ss'),  // format datetime and remove timezone
            "days_before_flood": info.days_before_flood,
            "days_after_flood": info.days_after_flood
        }
        fetcher.submit(
            body,
            { method: "POST", encType: "application/json" }
        )
    }

    const isSubmitting = fetcher.state === 'submitting'
    // Happy case shouldn't have any data here, because successful submissions redirect to the
    // page of the new floodmap.
    const hasErrorResponse = fetcher?.data

    useEffect(() => {
        if (hasErrorResponse) {
            setError(`Error - ${JSON.stringify(fetcher.data)}.`)
        }
    }, [fetcher.data, setError, hasErrorResponse,])

    useEffect(() => {
        if (isSubmitting) {
            setError('')
        }
    }, [isSubmitting, setError])

    return (
        <>
            <Dialog open={true} sx={{ mt: isShortScreen ? '114px' : '64px', }} PaperProps={{ sx: { maxHeight: '95%', margin: 1 } }}>
                <Box sx={{ border: 'solid', maxWidth: '445px', position: 'relative' }}>
                    {isSubmitting && <DimBox />}
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', }}>
                        <DialogTitle sx={{ p: 0 }}>Enter Name and Datetime</DialogTitle>
                        <Box
                            component='form'
                            onSubmit={handleSubmit(info => performSubmit(info))}
                            noValidate={true}
                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.6 }}
                        >
                            <TextFieldElement
                                required
                                control={control}
                                id="flood_name"
                                label="Flood name"
                                name="flood_name"
                                type="text"
                                variant="standard"
                                fullWidth={true}
                            />
                            <Controller
                                control={control}
                                name="flood_datetime"
                                render={({ field }) => {
                                    return (
                                        <DateTimePicker
                                            id="flood_datetime"
                                            label="Flood datetime (UTC)"
                                            value={field.value}
                                            inputRef={field.ref}
                                            onChange={(date) => {
                                                field.onChange(date)
                                            }}
                                            format="DD/MM/YYYY HH:mm"
                                            ampm={false}
                                            slotProps={{
                                                textField: {
                                                    variant: "standard",
                                                    fullWidth: true,
                                                    required: true,
                                                    error: !!errors.flood_datetime,
                                                    helperText: errors.flood_datetime?.message,
                                                },
                                                dialog: {  // ensures the popup on mobile does not overlap with the stepper
                                                    sx: {
                                                        mt: isShortScreen ? 10 : 16,
                                                    },
                                                },
                                            }}

                                        />
                                    )
                                }}
                            />
                            <Stack direction="row" spacing={3}>
                                <TextFieldElementNoArrows
                                    required
                                    control={control}
                                    id="days_before_flood"
                                    label="Days before flood"
                                    name="days_before_flood"
                                    type="number"
                                    variant="standard"
                                    sx={{ flex: 1 }}
                                />
                                <TextFieldElementNoArrows
                                    required
                                    control={control}
                                    id="days_after_flood"
                                    label="Days after flood"
                                    name="days_after_flood"
                                    type="number"
                                    variant="standard"
                                    sx={{ flex: 1 }}
                                />
                            </Stack>
                            <HelpAccordion
                                summary='What are the number of days used for?'
                                details='The number of days before and after the flood are used for the construction of the baseline image stack and the selection of the post flood image respectively. Keep the defaults if you are not sure what to enter.'
                            />
                            <Stack direction="row" spacing={3}>
                                <Button type='button' disabled={isSubmitting} onClick={() => setActiveStep(activeStep => activeStep - 1)}>BACK</Button>
                                <Button type='submit' variant='contained' disabled={isSubmitting}>SUBMIT</Button>
                            </Stack>
                            {hasErrorResponse && fetcher.state === 'idle' &&
                                <Typography variant='subtitle2' color='error'>
                                    Submission failed! Please try again later :(
                                </Typography>
                            }
                        </Box>
                    </DialogContent>
                </Box>
            </Dialog>
        </>
    )
}

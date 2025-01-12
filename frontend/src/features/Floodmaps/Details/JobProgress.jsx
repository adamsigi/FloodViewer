import Dialog from '@mui/material/Dialog'
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Stack from '@mui/material/Stack'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import CircleIcon from '@mui/icons-material/Circle'
import DoneIcon from '@mui/icons-material/Done'
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from "@mui/material/CircularProgress"
import { STAGES, FAILED_STATUS, PROGRESSING_STATUS } from "@utils/constants"
import useScreenHeightThreshold from '@hooks/useScreenHeightThreshold'
import { useMediaQuery } from '@mui/material'

export default function JobProgress({ lastJobUpdate, }) {
    const isShortScreen = useScreenHeightThreshold()
    const isNotExtraSmallScreen = useMediaQuery(theme => theme.breakpoints.up('sm'))

    const stageIndex = STAGES.indexOf(lastJobUpdate.stage)
    return (
        <>
            <Dialog
                open={true}
                sx={{ mt: '64px', }}
                PaperProps={{
                    sx: { maxHeight: (isShortScreen || isNotExtraSmallScreen) ? '90%' : window.innerHeight - 220, m: 1, mt: (isShortScreen || isNotExtraSmallScreen) ? 1 : 10 }
                }}
            >
                <Box sx={{ border: 'solid', maxWidth: '445px', }}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', }}>
                        <DialogTitle sx={{ p: 0, pb: 1 }}>Floodpy Job Status</DialogTitle>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', }}>
                            {lastJobUpdate.status === PROGRESSING_STATUS &&
                                <Typography>Your request to run Floodpy has been submitted and is now in <Typography color='primary' component='span'>progress</Typography>. Please wait as it goes through the following stages.</Typography>

                            }
                            {lastJobUpdate.status === FAILED_STATUS &&
                                <Typography>Your request to run Floodpy has been submitted but encountered an <Typography color='error' component='span'>error</Typography>. Please review the details below or try submitting again with different parameters.</Typography>
                            }
                            <Stack direction='column' gap={0.4} sx={{ m: 1 }}>
                                {STAGES.slice(0, -1).map((stage, index) =>
                                (
                                    <Stack key={stage} direction='row' alignItems='center' gap={0.3}>
                                        {index > stageIndex &&
                                            <>
                                                <CircleIcon sx={{ width: 10, height: 10, m: '7px', mr: '15px' }} />
                                                <Typography variant="body1" >{stage}</Typography>
                                            </>
                                        }
                                        {index < stageIndex &&
                                            <>
                                                <DoneIcon fontSize='medium' color="success" sx={{ mr: 1 }} />
                                                <Typography variant="body1" color="success.main" >{stage}</Typography>
                                            </>
                                        }
                                        {index === stageIndex && lastJobUpdate.status === PROGRESSING_STATUS &&
                                            <>
                                                <CircularProgress size={18} color="primary" sx={{ m: '3px', mr: '11px' }} />
                                                <Typography variant="body1" color="primary.main">{stage}</Typography>
                                            </>
                                        }
                                        {index === stageIndex && lastJobUpdate.status === FAILED_STATUS &&
                                            <>
                                                <CloseIcon color="error" sx={{ mr: 1 }} />
                                                <Typography variant="body1" color="error">{stage}</Typography>
                                            </>
                                        }
                                    </Stack>
                                )
                                )}
                            </Stack>
                            {lastJobUpdate.status === FAILED_STATUS &&
                                <Typography variant='subtitle1' color='error' sx={{ mt: 1, maxWidth: '390px', overflow: 'clip', overflowWrap: 'break-word' }}>
                                    {lastJobUpdate.error_trace}
                                </Typography>
                            }
                            {stageIndex === 0 && lastJobUpdate.status !== FAILED_STATUS &&
                                <Typography variant='subtitle2' sx={(theme) => ({ mt: 1, maxWidth: '390px', overflow: 'clip', overflowWrap: 'break-word', color: theme.palette.info.main })}>
                                    Please note that running Floodpy is computationally intensive. As such, all jobs need to be approved by administration prior to execution.
                                </Typography>
                            }
                            {stageIndex == 2 && lastJobUpdate.status === PROGRESSING_STATUS &&
                                <Typography variant='subtitle2' sx={(theme) => ({ mt: 1, maxWidth: '390px', overflow: 'clip', overflowWrap: 'break-word', color: theme.palette.info.main })}>
                                    Confirming whether there was precipitation in the area of interest during the selected date and time.
                                </Typography>
                            }
                            {stageIndex >= 3 && stageIndex <= 6 && lastJobUpdate.status === PROGRESSING_STATUS &&
                                <Typography variant='subtitle2' sx={(theme) => ({ mt: 1, maxWidth: '390px', overflow: 'clip', overflowWrap: 'break-word', color: theme.palette.info.main })}>
                                    The success of Floodpy jobs is often determined by the availability of Sentinel-1 data.
                                </Typography>
                            }
                            {stageIndex == 7 && lastJobUpdate.status === PROGRESSING_STATUS &&
                                <Typography variant='subtitle2' sx={(theme) => ({ mt: 1, maxWidth: '390px', overflow: 'clip', overflowWrap: 'break-word', color: theme.palette.info.main })}>
                                    Flood mapping completed successfully. The results are being stored and will appear shortly.
                                </Typography>
                            }
                        </Box>
                    </DialogContent>
                </Box>
            </Dialog>
        </>
    )
}

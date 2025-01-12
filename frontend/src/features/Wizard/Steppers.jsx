import Box from '@mui/material/Box'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight'
import Stack from '@mui/material/Stack'
import { Z_INDEXES } from '../../utils/constants'

export function FullStepper({ steps, activeStep, setActiveStep, error, setError }) {
    const handleNext = () => {
        if (activeStep < 3) {
            setActiveStep(activeStep + 1)
            setError('')
        }
    }
    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1)
            setError('')
        }
    }
    return (
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ position: 'relative', zIndex: Z_INDEXES.OverMUIDialogShadow, m: 1, backgroundColor: 'white', border: 'solid', '.MuiStepConnector-line': { minHeight: 12 }, px: 2, py: 1, maxWidth: 280, }}>
            {steps.map((step, index) => (
                <Step key={step.label}>
                    <StepLabel error={activeStep === index && !!error}>{step.label}</StepLabel>
                    <StepContent>
                        <Typography>{step.description}</Typography>
                        {index !== steps.length - 1 &&
                            <Box sx={{ mb: 1 }}>
                                {index !== 0 && <Button onClick={handleBack} sx={{ mt: 1, mr: 1 }}>BACK</Button>}
                                <Button
                                    disabled={!!error}
                                    variant="contained"
                                    onClick={handleNext}
                                    sx={{ mt: 1, mr: 1 }}
                                >
                                    CONTINUE
                                </Button>
                            </Box>
                        }
                        {!!error && <Typography variant='body2' color='error' sx={{ pt: '2px' }}>{error}</Typography>}
                    </StepContent>
                </Step>
            ))}
        </Stepper>
    )
}


export function CompactStepper({ steps, activeStep, setActiveStep, error, setError }) {
    const handleNext = () => {
        if (activeStep < 3) {
            setActiveStep(activeStep + 1)
            setError('')
        }
    }
    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1)
            setError('')
        }
    }
    return (
        <Box sx={{ zIndex: Z_INDEXES.OverMUIDialogShadow, maxWidth: 580, p: 1, backgroundColor: 'white', m: 1, border: 'solid' }}>
            <Stepper activeStep={activeStep} alternativeLabel={true} >
                {steps.map((step, index) => (
                    <Step key={step.label} sx={{ '.MuiStepLabel-label': { mt: '6px !important' }, }}>
                        <StepLabel error={activeStep === index && !!error}>{step.label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            {activeStep < steps.length - 1 &&
                <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mx: 2, mt: 1 }}>
                    <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>BACK</Button>
                    <Button
                        disabled={!!error}
                        variant="contained"
                        onClick={handleNext}
                        sx={{ ml: 1 }}
                    >
                        CONTINUE
                    </Button>
                </Box>
            }
            <Box sx={{ flex: 1, textAlign: 'center' }}>
                {!!error && <Typography variant='body2' color='error' sx={{ mt: 1 }}>{error}</Typography>}
            </Box>
        </Box>
    )
}


export function MinimalStepper({ steps, activeStep, setActiveStep, error, setError }) {
    const handleNext = () => {
        if (activeStep < 3) {
            setActiveStep(activeStep + 1)
            setError('')
        }
    }
    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1)
            setError('')
        }
    }
    return (
        <Box sx={{ zIndex: Z_INDEXES.OverMUIDialogShadow, width: '100%', p: 1, backgroundColor: 'white', m: 0, border: 'solid', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {activeStep < steps.length - 1 &&
                <Button disabled={activeStep === 0} onClick={handleBack}>
                    <KeyboardArrowLeft />
                    BACK
                </Button>
            }
            <Stack direction="column" justifyContent='center' alignItems='center' sx={{ flex: 1 }}>
                <Stack direction="row" alignItems='center' gap={1}>
                    <Typography color='primary' variant='body2' sx={(theme) => ({ backgroundColor: theme.palette.primary.main, borderRadius: 4, p: '4px', color: theme.palette.background.default, fontSize: '0.75rem' })}>{activeStep + 1}/3</Typography>
                    <Typography>{steps[activeStep].label}</Typography>
                </Stack>
                <Typography color='error' variant='caption' sx={{ textAlign: 'center', maxWidth: '70%' }}>{error}</Typography>
            </Stack>
            {activeStep < steps.length - 1 &&
                <Button
                    size="small"
                    disabled={!!error}
                    onClick={handleNext}
                >
                    CONTINUE
                    <KeyboardArrowRight />
                </Button>
            }
        </Box>
    )
}

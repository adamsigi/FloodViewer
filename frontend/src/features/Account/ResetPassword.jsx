import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Stack from "@mui/material/Stack"

import { TextFieldElement, useForm } from "react-hook-form-mui"
import { yupResolver } from "@hookform/resolvers/yup"
import { emailSchema } from "@utils/validationSchemas"
import { useFetcher, useNavigate, } from "react-router-dom"
import DynamicDialog from "@components/DynamicDialog"
import DimBox from "@components/DimBox"
import { useEffect, useState } from "react"

export default function ResetPassword() {
    const fetcher = useFetcher()
    const navigate = useNavigate()
    const [inVerificationStep, setInVerificationStep] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const { control, handleSubmit, setError } = useForm({
        resolver: yupResolver(emailSchema),
        defaultValues: {
            email: null,
        },
    })

    function performSubmit(info) {
        const body = {
            "email": info.email,
        }
        setUserEmail(info.email)
        fetcher.submit(
            body,
            { method: "POST", encType: "application/json" }
        )
    }

    const isSubmitting = fetcher.state === 'submitting'
    const hasErrorResponse = fetcher.data && (fetcher.data.status === 400)
    const hasSuccessResponse = fetcher.data && (fetcher.data.status === 204)

    useEffect(() => {
        if (hasErrorResponse && fetcher.state === 'idle') {
            setError("email", {
                type: "400",
                message: 'User with given email does not exist'
            })
        }
        else if (hasSuccessResponse && fetcher.state === 'idle' && !inVerificationStep) {
            setInVerificationStep(true)
        }
    }, [hasErrorResponse, fetcher.state, setError, hasSuccessResponse, inVerificationStep])

    return (
        <DynamicDialog>
            {isSubmitting && <DimBox />}
            {inVerificationStep ?
                (
                    <Box>
                        <Typography variant="h6" color='success.main'>Password Reset Email Sent!</Typography>
                        <Typography variant="body1" sx={{mt: 1}}>
                            An email has been sent to{' '}
                            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {userEmail}
                            </Box>
                            . Please check your inbox and click the link in the email to reset your password.
                        </Typography>
                    </Box>
                ) :
                (
                    <Box>
                        <Typography variant="h5">Password reset</Typography>
                        <Typography variant="body1" sx={{ my: 1 }}>
                            Please enter your registered email to receive a link to reset your password.
                        </Typography>
                        <Box
                            component='form'
                            method='post'
                            onSubmit={handleSubmit(info => performSubmit(info))}
                            noValidate={true}
                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.6, }}
                        >
                            <TextFieldElement
                                required
                                control={control}
                                id="email"
                                label="Email"
                                name="email"
                                type="email"
                                variant="standard"
                                fullWidth={true}
                            />
                            <Stack direction='row' gap={2} sx={{ mt: 2 }}>
                                <Button type='button' variant='outlined' disabled={isSubmitting} onClick={() => navigate('/login')}>CANCEL</Button>
                                <Button type='submit' variant='contained' disabled={isSubmitting}>SEND EMAIL</Button>
                            </Stack>
                        </Box>
                    </Box>
                )
            }

        </DynamicDialog>
    )
}

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"

import { TextFieldElement, useForm } from "react-hook-form-mui"
import { yupResolver } from "@hookform/resolvers/yup"
import { signUpSchema } from "@utils/validationSchemas"
import { Link, useFetcher, useNavigate, } from "react-router-dom"
import DynamicDialog from "@components/DynamicDialog"
import DimBox from "@components/DimBox"
import { useEffect, useState } from "react"
import { useIsLoggedIn } from "@services/authService"

export default function SignUp() {
    const isLoggedIn = useIsLoggedIn()
    const navigate = useNavigate()
    const fetcher = useFetcher()
    const [inVerificationStep, setInVerificationStep] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const { control, handleSubmit, setError } = useForm({
        resolver: yupResolver(signUpSchema),
        defaultValues: {
            email: null,
            password: null,
            re_password: null,
        },
    })

    function performSubmit(info) {
        const body = {
            "email": info.email,
            "password": info.password,
            "re_password": info.re_password
        }
        setUserEmail(info.email)
        fetcher.submit(
            body,
            { method: "POST", encType: "application/json" }
        )
    }

    const isSubmitting = fetcher.state === 'submitting'
    const hasErrorResponse = fetcher.data && (fetcher.data.status === 400)
    const hasSuccessResponse = fetcher.data && (fetcher.data.status === 201)

    useEffect(() => {
        if (isLoggedIn) {
            navigate('/floodmaps')
        }
        else if (hasErrorResponse && fetcher.state === 'idle') {
            setError("email", {
                type: "400",
                message: 'Email already in use'
            })
        }
        else if (hasSuccessResponse && fetcher.state === 'idle' && !inVerificationStep) {
            setInVerificationStep(true)
        }
    }, [hasErrorResponse, fetcher.state, setError, hasSuccessResponse, inVerificationStep, isLoggedIn, navigate])

    return (
        <DynamicDialog>
            {isSubmitting && <DimBox />}
            {inVerificationStep ?
                (
                    <Box>
                        <Typography variant="h6" color='success.main'>Verification Email Sent!</Typography>
                        <Typography variant="body1" sx={{mt: 1}}>
                            An email has been sent to{' '}
                            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {userEmail}
                            </Box>
                            . Please check your inbox and click the link in the email to complete the sign-up process.
                        </Typography>
                    </Box>
                ) :
                (
                    <Box>
                        <Typography variant="h5">Sign up</Typography>
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
                            <TextFieldElement
                                required
                                control={control}
                                id="password"
                                label="Password"
                                name="password"
                                type="password"
                                variant="standard"
                                fullWidth={true}
                            />
                            <TextFieldElement
                                required
                                control={control}
                                id="re_password"
                                label="Confirm Password"
                                name="re_password"
                                type="password"
                                variant="standard"
                                fullWidth={true}
                            />
                            <Button type='submit' variant='contained' disabled={isSubmitting} sx={{ mt: 2 }}>SIGN UP</Button>
                            <Typography component='div'>
                                Already have an account? <Link to='/login'><Typography color='primary' component='span'>Log in</Typography></Link>
                            </Typography>
                        </Box>
                    </Box>
                )
            }

        </DynamicDialog>
    )
}

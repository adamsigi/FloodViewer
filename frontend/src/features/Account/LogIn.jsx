import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Alert from "@mui/material/Alert"

import { TextFieldElement, useForm } from "react-hook-form-mui"
import { yupResolver } from "@hookform/resolvers/yup"
import { logInSchema } from "@utils/validationSchemas"
import { Link, useFetcher, useLocation, useNavigate, } from "react-router-dom"
import { useEffect, useRef } from "react"
import DimBox from "@components/DimBox"
import DynamicDialog from "@components/DynamicDialog"
import { useIsLoggedIn } from "@services/authService"

export default function LogIn() {
    const fetcher = useFetcher()
    const navigate = useNavigate()
    const isLoggedIn = useIsLoggedIn()
    const alertRef = useRef(useLocation().state?.alert)
    const { control, handleSubmit, resetField } = useForm({
        resolver: yupResolver(logInSchema),
        defaultValues: {
            email: null,
            password: null,
        },
    })

    function performSubmit(info) {
        if (alertRef.current) {
            alertRef.current = undefined
        }
        const body = {
            "email": info.email,
            "password": info.password,
        }
        fetcher.submit(
            body,
            { method: "POST", encType: "application/json" }
        )
    }

    const isSubmitting = fetcher.state === 'submitting'
    const hasErrorResponse = fetcher.data && (fetcher.data.status === 401)

    useEffect(() => {
        if (hasErrorResponse && fetcher.state === 'idle') {
            resetField('password')
        }
        else if (isLoggedIn) {
            navigate('/floodmaps')
        }
    }, [hasErrorResponse, fetcher.state, fetcher.data, resetField, navigate, isLoggedIn])

    return (
        <DynamicDialog>
            {isSubmitting && <DimBox />}

            <Typography variant="h5">Log in</Typography>
            {hasErrorResponse && fetcher.state === 'idle' &&
                <Typography variant='subtitle1' color='error' sx={{ py: 1 }}>
                    Incorrect email or password!
                </Typography>
            }
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
                <Box sx={{width: '100%', display: 'flex', justifyContent: 'start'}}>
                    <Link to='/password_reset'><Typography color='primary' variant="body2">Forgot password?</Typography></Link>
                </Box>
                <Button type='submit' variant='contained' disabled={isSubmitting} sx={{ mt: 2 }}>LOG IN</Button>
                <Typography component='div'>
                    Don&apos;t have an account? <Link to='/signup'><Typography color='primary' component='span'>Sign up</Typography></Link>
                </Typography>

                {alertRef.current &&
                    <Alert severity={alertRef.current.severity} >
                        {alertRef.current.message}
                    </Alert>
                }
            </Box>
        </DynamicDialog>
    )
}

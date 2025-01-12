import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Stack from "@mui/material/Stack"

import { TextFieldElement, useForm } from "react-hook-form-mui"
import { yupResolver } from "@hookform/resolvers/yup"
import { changePasswordSchema, deleteAccountSchema } from "@utils/validationSchemas"
import { useFetcher, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import DimBox from "@components/DimBox"
import DynamicDialog from "@components/DynamicDialog"
import { clearAuth } from "@services/authService"

export default function Settings() {
    const [aboutToDeleteAccount, setAboutToDeleteAccount] = useState(false)

    return (
        <DynamicDialog>
            {!aboutToDeleteAccount && <ChangePassword />}
            <DeleteAccount aboutToDeleteAccount={aboutToDeleteAccount} setAboutToDeleteAccount={setAboutToDeleteAccount} />
        </DynamicDialog>
    )
}

function ChangePassword() {
    const fetcher = useFetcher()
    const navigate = useNavigate()
    const { control, handleSubmit, reset, setError } = useForm({
        resolver: yupResolver(changePasswordSchema),
        defaultValues: {
            current_password: null,
            new_password: null,
            re_new_password: null,
        },
    })

    function handleChangePassword(info) {
        const body = {
            "current_password": info.current_password,
            "new_password": info.new_password,
            "re_new_password": info.re_new_password,
        }
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
            reset()
            setError("current_password", {
                type: "400",
                message: 'Invalid password'
            })
        }
        else if (hasSuccessResponse && fetcher.state === 'idle') {
            clearAuth()
            navigate('/login', {
                state: { alert: { message: "Password changed", severity: "success" } }
            })
        }
    }, [hasErrorResponse, hasSuccessResponse, fetcher.state, reset, setError, navigate])

    return (
        <Box>
            {isSubmitting && <DimBox />}
            <Typography variant="h6">Change Password</Typography>
            <Box
                component='form'
                method='post'
                onSubmit={handleSubmit(info => handleChangePassword(info))}
                noValidate={true}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.6, }}
            >
                <TextFieldElement
                    required
                    control={control}
                    id="current_password"
                    label="Current Password"
                    name="current_password"
                    type="password"
                    variant="standard"
                    fullWidth={true}
                />

                <TextFieldElement
                    required
                    control={control}
                    id="new_password"
                    label="New Password"
                    name="new_password"
                    type="password"
                    variant="standard"
                    fullWidth={true}
                />
                <TextFieldElement
                    required
                    control={control}
                    id="re_new_password"
                    label="Confirm New Password"
                    name="re_new_password"
                    type="password"
                    variant="standard"
                    fullWidth={true}
                />
                <Button type='submit' variant='contained' disabled={isSubmitting} sx={{ mt: 2 }}>CHANGE PASSWORD</Button>
            </Box>
        </Box>
    )
}


function DeleteAccount({ aboutToDeleteAccount, setAboutToDeleteAccount }) {
    const fetcher = useFetcher()
    const navigate = useNavigate()
    const { control, handleSubmit, reset, setError } = useForm({
        resolver: yupResolver(deleteAccountSchema),
        defaultValues: {
            current_password: null,
        },
    })

    function handleDeleteAccount(info) {
        if (!aboutToDeleteAccount) {
            setAboutToDeleteAccount(true)
        }
        else {
            const body = {
                "current_password": info.current_password,
            }
            fetcher.submit(
                body,
                { method: "DELETE", encType: "application/json" }
            )
        }
    }

    const isSubmitting = fetcher.state === 'submitting'
    const hasErrorResponse = fetcher.data && (fetcher.data.status === 400)
    const hasSuccessResponse = fetcher.data && (fetcher.data.status === 204)

    useEffect(() => {
        if (hasErrorResponse && fetcher.state === 'idle') {
            reset()
            setError("current_password", {
                type: "400",
                message: 'Invalid password'
            })
        }
        else if (hasSuccessResponse && fetcher.state === 'idle') {
            clearAuth()
            navigate('/login', {
                state: { alert: { message: "Account deleted", severity: "info" } }
            })
        }
    }, [hasErrorResponse, hasSuccessResponse, fetcher.state, reset, setError, navigate])

    return (
        <Box sx={{ mt: aboutToDeleteAccount ? 0 : 3 }}>
            {isSubmitting && <DimBox />}
            <Typography variant="h6">Delete Account</Typography>
            {aboutToDeleteAccount ?
                (
                    <Box
                        component='form'
                        method='post'
                        onSubmit={handleSubmit(info => handleDeleteAccount(info))}
                        noValidate={true}
                        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.6, }}
                    >
                        <TextFieldElement
                            required
                            control={control}
                            id="current_password"
                            label="Password"
                            name="current_password"
                            type="password"
                            variant="standard"
                            fullWidth={true}
                        />
                        <Stack direction='row' gap={2} sx={{ mt: 2 }}>
                            <Button type='button' variant='outlined' disabled={isSubmitting} onClick={() => setAboutToDeleteAccount(false)}>CANCEL</Button>
                            <Button type='submit' variant='contained' color='error' disabled={isSubmitting} >DELETE</Button>
                        </Stack>
                    </Box>
                ) :
                (
                    <Box>
                        <Typography variant="body2" color='error' sx={{ mt: '2px' }}>Warning: This action cannot be undone.</Typography>
                        <Button
                            onClick={handleDeleteAccount}
                            variant='contained'
                            color='error'
                            sx={{ mt: 2 }}
                            disabled={isSubmitting}
                        >
                            DELETE ACCOUNT
                        </Button>
                    </Box>
                )
            }
        </Box>
    )
}

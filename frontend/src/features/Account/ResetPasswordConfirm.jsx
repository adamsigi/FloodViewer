import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"

import { TextFieldElement, useForm } from "react-hook-form-mui"
import { yupResolver } from "@hookform/resolvers/yup"
import { resetPasswordSchema } from "@utils/validationSchemas"
import { Link, useFetcher, useNavigate, useParams, } from "react-router-dom"
import DynamicDialog from "@components/DynamicDialog"
import DimBox from "@components/DimBox"
import { useEffect } from "react"

export default function ResetPasswordConfirm() {
    const fetcher = useFetcher()
    const navigate = useNavigate()
    const { uid, token } = useParams()
    const { control, handleSubmit } = useForm({
        resolver: yupResolver(resetPasswordSchema),
        defaultValues: {
            new_password: null,
            re_new_password: null,
        },
    })

    function performSubmit(info) {
        const body = {
            "new_password": info.new_password,
            "re_new_password": info.re_new_password,
            "uid": uid,
            "token": token,
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
        if (hasSuccessResponse) {
            navigate('/login', {
                state: { alert: { message: "Password reset successful", severity: 'success' } }
            })
        }
    }, [hasSuccessResponse, navigate])

    return (
        <DynamicDialog>
            {isSubmitting && <DimBox />}
            {hasErrorResponse ?
                (
                    <Box>
                        <Typography variant="h6" color='error'>Password Reset Failed!</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            This link has either already been used or does not correspond to an active user.
                            Please <Link to='/password_reset'><Typography color='primary' component='span'>start over</Typography></Link> to 
                            receive a valid link.
                        </Typography>
                    </Box>
                ) :
                (
                    <Box>
                        <Typography variant="h5">Password reset</Typography>
                        <Typography variant="body1" sx={{ my: 1 }}>
                            Please enter and confirm your new password.
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
                            <Button type='submit' variant='contained' disabled={isSubmitting} sx={{ mt: 2 }}>SUBMIT</Button>
                        </Box>
                    </Box>
                )
            }
        </DynamicDialog>
    )
}

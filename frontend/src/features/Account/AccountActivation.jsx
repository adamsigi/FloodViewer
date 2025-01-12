import Typography from "@mui/material/Typography"
import { useLoaderData, useNavigate, } from "react-router-dom"
import DynamicDialog from "@components/DynamicDialog"
import { useEffect } from "react"

export default function AccountActivation() {
    const activationResponse = useLoaderData()
    const navigate = useNavigate()

    const hasSuccessResponse = activationResponse.status === 204
    useEffect(() => {
        if (hasSuccessResponse) {
            navigate('/login', {
                state: { alert: { message: "Account activated", severity: 'success' } }
            })
        }
    }, [hasSuccessResponse, navigate])

    return (
        <DynamicDialog>
            {!hasSuccessResponse &&
                <>
                    <Typography variant="h6" color='error'>Verification Error!</Typography>
                    <Typography variant="body1" sx={{mt: 1}}>
                        User does not exist or has already been activated.
                    </Typography>
                </>
            }
        </DynamicDialog>
    )
}

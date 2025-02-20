import Typography from "@mui/material/Typography"
import Stack from "@mui/material/Stack"
import { Link, useRouteError } from "react-router-dom"
import { useOnlineStatus } from "../hooks/useOnlineStatus"
import HelpAccordion from "../components/HelpAccordion"
import Box from "@mui/material/Box"

export function Error({ trace = 'Sorry, an unexpected error has occurred.' }) {
    const routeError = useRouteError()
    const isOnline = useOnlineStatus()

    let message
    if (!isOnline) {
        message = "You're offline. Please check your connection."
    }
    else if (routeError?.status && routeError?.statusText) {
        message = `${routeError.status} - ${routeError.statusText}`
    }
    else {
        message = trace
    }
    return (
        <Stack
            sx={{ height: '100dvh', m: 1, pb: 6 }}
            direction="column"
            justifyContent="center"
            alignItems="center"
        >
            <Typography variant="h1">Oops!</Typography>
            <Typography variant="body1">{message}</Typography>
            {isOnline ? <Typography variant="subtitle1">Go to <Link to='/floodmaps'>Home</Link></Typography> :
                <Typography variant="subtitle1"><Link to=''>Retry</Link></Typography>
            }
            {routeError?.data &&
                <Box sx={{ width: '235px', mt: 2, color: 'gray'}}>
                    <HelpAccordion summary='view details' details={routeError.data} />
                </Box>
            }
        </Stack>
    )
}

export function NotFound() {
    return (
        <Stack
            sx={{ height: '100dvh', m: 1, pb: 6 }}
            direction="column"
            justifyContent="center"
            alignItems="center"
        >
            <Typography variant="h1">Oops!</Typography>
            <Typography variant="body1">Sorry, this page is not available.</Typography>
            <Typography variant="body1">404 - Not Found</Typography>
            <Typography variant="subtitle1">Go to <Link to='/floodmaps'>Home</Link></Typography>
        </Stack>
    )
}

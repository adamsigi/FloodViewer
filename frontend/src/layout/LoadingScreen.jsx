import CircularProgress from "@mui/material/CircularProgress"
import Backdrop from "@mui/material/Backdrop"
import FloodViewerLogo from "../components/FloodViewerLogo"
import Stack from "@mui/material/Stack"

export default function LoadingScreen() {
    return (
        <Backdrop open={true} data-testid='loading-screen'>
            <Stack direction='column' alignItems='center' gap={5}>
                <FloodViewerLogo variant='h4' fontSize='2.3rem' />
                <CircularProgress size='7rem' color='inherit' />
            </Stack>
        </Backdrop>
    )
}

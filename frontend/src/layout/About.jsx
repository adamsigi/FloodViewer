import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import FloodViewerLogo from '@components/FloodViewerLogo'
import StyledLink from '@components/StyledLink'
import DynamicDialog from "@components/DynamicDialog"

export default function About() {

    return (
        <DynamicDialog>
            <Stack gap={1} alignItems='start' sx={{ textAlign: 'start' }}>
                <Stack direction='row' gap={1} sx={{mb: '2px', width: '100%'}} justifyContent='center' alignItems='center'>
                    <Typography variant='h5'>
                            Welcome to 
                        </Typography>
                        <Typography color="primary"><FloodViewerLogo variant={'h6'} fontSize="1.6rem" to='/floodmaps' /></Typography>
                </Stack>
                <Typography>
                    This app is designed to simplify the process of mapping floods using <StyledLink href='https://en.wikipedia.org/wiki/Synthetic-aperture_radar'>SAR </StyledLink>
                    images from <StyledLink href='https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1'>Sentinel-1</StyledLink>.
                </Typography>

                <Typography>
                    Just visit the <StyledLink href='/Create' inNew={false}>Create</StyledLink> page, select an area and a date of a flood event, and the app will use
                    <StyledLink href='https://github.com/kleok/FLOODPY'> FLOODPY</StyledLink> to generate a map of the flooded areas.
                </Typography>

                <Typography>
                    You can also explore existing maps on the <StyledLink href='/floodmaps'>Floodmaps</StyledLink> page and view examples of the results produced.
                </Typography>

                <Typography>
                    If you encounter any bugs or have suggestions for improvements, please visit our <StyledLink href='https://github.com/adamsigi/FloodViewer'>GitHub</StyledLink> page and open an issue.
                </Typography>

                <Typography>
                    Please note: This app comes with NO WARRANTIES OF CORRECTNESS and is primarily intended for research purposes.
                </Typography>

            </Stack>
        </DynamicDialog>
    )
}

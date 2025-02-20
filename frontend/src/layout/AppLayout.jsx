import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import { Suspense } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import ThemeProvider from '@mui/material/styles/ThemeProvider'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { Outlet, useNavigation } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import FloodViewerNavBar from './FloodViewerNavBar'
import LoadingScreen from '@layout/LoadingScreen.jsx'
import theme from '@utils/muiTheme'


export default function AppLayout() {
    const navigation = useNavigation()
    const isLoading = navigation.state === "loading"

    return (
        <MainContainer>
            <FloodViewerNavBar />
            {isLoading ? (
                <Stack justifyContent='center' alignItems='center' sx={{ flex: 1 }}>
                    <CircularProgress color='primary' size='6rem' sx={{ opacity: 0.5, }} />
                </Stack>
            ) :
                <Suspense fallback={<LoadingScreen />}>
                    <Outlet />
                </Suspense>
            }
        </MainContainer>
    )
}

function MainContainer({ children }) {
    return (
        <Box sx={{ m: 0, p: 0, width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <ThemeProvider theme={theme}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <CssBaseline />
                    {children}
                </LocalizationProvider>
            </ThemeProvider>
        </Box>
    )
}

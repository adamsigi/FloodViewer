import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"

export default function DynamicDialog({ children }) {
    return (
        <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            mx: { xs: 0, md: 1 },
            mb: { xs: 0, md: 6 }
        }}>
            <Paper sx={{
                maxWidth: '100%',
                width: { xs: '100%', md: '445px' },
                flex: { xs: 1, md: 'none' },
                border: { xs: 'none', md: 'solid' },
                textAlign: 'center',
                px: 3,
                py: '20px',
                position: 'relative'
            }}>
                {children}
            </Paper>
        </Box>
    )
}

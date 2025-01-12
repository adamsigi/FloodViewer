import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"

export default function DimBox() {
    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                bgcolor: 'rgba(0, 0, 0, 0.4)',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
            }}
        >
            <LinearProgress color="primary" sx={{ width: '95%', mt: '5px', }} />
        </Box>
    )
}

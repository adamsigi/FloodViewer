import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Z_INDEXES } from '@utils/constants';


export default function BackscatterColormap({ s1BackscatterQuantiles }) {
    return (
        <Box sx={{
            zIndex: Z_INDEXES.OverMap,
            m: 1,
            border: '1px solid',
            width: 282, height: '12px',
            background: 'linear-gradient(to right, black, white 95%)',
            position: 'relative'
        }}
        >
            <Typography variant='caption' sx={{position: 'absolute', fontWeight: '500', bottom: 10, left: -3}}>{s1BackscatterQuantiles[0].toFixed(2)}</Typography>
            <Typography variant='caption' sx={{position: 'absolute', fontWeight: '500', bottom: 10, right: 0}}>{s1BackscatterQuantiles[1].toFixed(2)}</Typography>
            <Typography variant='caption' sx={{position: 'absolute', fontWeight: '500', top: 10, left: 0}}>Backscatter coefficient VV (db)</Typography>
        </Box>
    )
}

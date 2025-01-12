import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Z_INDEXES } from '@utils/constants'
import { LC_CATEGORIES, LC_COLORBAR } from '@utils/constants'


export default function EsaWorldCoverCategories({ landCoverCategories }) {
    return (
        <Box sx={{ backgroundColor: 'white', p: 1, px: 2, m: 1, border: 'solid ', position: 'relative', zIndex: Z_INDEXES.OverMap, }} >
            <Typography variant='subtitle1' sx={{fontWeight: 'bold'}}>ESA WorldCover 2021 Categories</Typography>

            {landCoverCategories.map(landCoverCategory => {
                return (
                    <Stack direction='row' alignItems='center' key={landCoverCategory}>
                        <Box sx={{ backgroundColor: LC_COLORBAR[landCoverCategory], border: '1px solid', width: '28px', height: '18px', mr: '6px', my: '3px' }} />
                        <Typography>
                            {LC_CATEGORIES[landCoverCategory]}
                        </Typography>
                    </Stack>
                )
            })}
        </Box>
    )
}

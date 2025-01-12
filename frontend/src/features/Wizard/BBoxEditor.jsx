import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { TextFieldNoArrows } from '@components/StyledElements'
import { bBoxSchema } from '@utils/validationSchemas'
import { Z_INDEXES } from '@utils/constants'


export default function BBoxEditor({ bBox, setBBox, areaSelectRef }) {
    // Not using react-hook-form because there is no need for detailed error messages and because of the sync/de-sync requirement.
    const [isDisabled, setIsDisabled] = useState(true)
    const [displayedBBox, setDisplayedBBox] = useState({ ...bBox })
    const [error, setError] = useState(false)

    useEffect(() => {
        if (isDisabled) {
            setDisplayedBBox({ ...bBox })
            setError(false)
        }
    }, [bBox, isDisabled])


    function handleChange(event) {
        const newDisplayedBBox = {
            ...displayedBBox,
            [event.target.name]: event.target.value
        }
        try {
            bBoxSchema.validateSync(newDisplayedBBox)
            setError(false)
        }
        catch (_) {
            setError(true)
        }
        setDisplayedBBox(newDisplayedBBox)
    }

    function applyBBoxCoordinates() {
        areaSelectRef.current.getAreaSelect().setBounds([{ lat: displayedBBox.min_lat, lng: displayedBBox.min_lng }, { lat: displayedBBox.max_lat, lng: displayedBBox.max_lng }])
        setBBox(displayedBBox)
        setIsDisabled(true)
    }

    return (
        <Box sx={{ maxWidth: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, backgroundColor: 'white', p: 2, pb: 1, m: 1, border: 'solid ', zIndex: Z_INDEXES.OverMap, }} >
            <Stack direction="row" sx={{ flex: 1 }} spacing={2}>
                <TextFieldNoArrows
                    id="max_lat"
                    label="Max Lat."
                    name="max_lat"
                    type="number"
                    variant="outlined"
                    size='small'
                    value={displayedBBox.max_lat}
                    onChange={handleChange}
                    disabled={isDisabled}
                />
                <TextFieldNoArrows
                    id="min_lat"
                    label="Min Lat."
                    name="min_lat"
                    type="number"
                    variant="outlined"
                    size='small'
                    value={displayedBBox.min_lat}
                    onChange={handleChange}
                    disabled={isDisabled}
                />
            </Stack>
            <Stack direction="row" sx={{ flex: 1, mt: '4px' }} spacing={2}>
                <TextFieldNoArrows
                    id="max_lng"
                    label="Max Lng."
                    name="max_lng"
                    type="number"
                    variant="outlined"
                    size='small'
                    value={displayedBBox.max_lng}
                    onChange={handleChange}
                    disabled={isDisabled}
                />
                <TextFieldNoArrows
                    id="min_lng"
                    label="Min Lng."
                    name="min_lng"
                    type="number"
                    variant="outlined"
                    size='small'
                    value={displayedBBox.min_lng}
                    onChange={handleChange}
                    disabled={isDisabled}
                />
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                {isDisabled ? (
                    <Button size='small' disableRipple={true} onClick={() => setIsDisabled(false)}>EDIT</Button>
                ) :
                    (
                        <>
                            <Button size='small' disableRipple={true} onClick={() => setIsDisabled(true)}>CANCEL</Button>
                            <Button size='small' disableRipple={true} disabled={error} onClick={applyBBoxCoordinates}>APPLY</Button>
                        </>
                    )}
            </Box>
            {error && <Typography variant='caption' color='error'>Invalid BBox parameters</Typography>}
        </Box>
    )
}

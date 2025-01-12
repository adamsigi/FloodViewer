import { useState } from 'react'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import IconButton from '@mui/material/IconButton'
import HelpIcon from '@mui/icons-material/Help'
import { Z_INDEXES } from '@utils/constants'

export default function HelpTooltip({ message }) {
    const [openTooltip, setOpenTooltip] = useState(false)
    return (
        <ClickAwayListener onClickAway={() => setOpenTooltip(false)}>
            <Tooltip
                slotProps={{
                    popper: {
                        sx: {
                            [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
                            {
                                marginTop: '0px',
                            },
                            [`&.${tooltipClasses.popper}[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]:
                            {
                                marginBottom: '0px',
                            },
                            [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]:
                            {
                                marginLeft: '0px',
                            },
                            [`&.${tooltipClasses.popper}[data-popper-placement*="left"] .${tooltipClasses.tooltip}`]:
                            {
                                marginRight: '0px',
                            },
                        },
                    },
                }}
                onClose={() => setOpenTooltip(false)}
                open={openTooltip}
                disableFocusListener
                disableHoverListener
                disableTouchListener
                title={message}
                placement="left"
                arrow
            >
                <IconButton aria-label="help" onClick={() => setOpenTooltip(true)} sx={{zIndex: Z_INDEXES.OverMUIDialogShadow, p: 0,}}>
                    <HelpIcon sx={{ width: '1.2em', height: '1.2em', }} />
                </IconButton>
            </Tooltip>
        </ClickAwayListener>
    )
}
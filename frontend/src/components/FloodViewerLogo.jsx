import Typography from "@mui/material/Typography"
import { MdOutlineFlood } from "react-icons/md"
import { useNavigate } from "react-router-dom"

export default function FloodViewerLogo({ variant, fontSize, to }) {
    const navigate = useNavigate()
    return (
        <Typography
            onClick={() => {navigate(to)}}
            variant={variant}
            noWrap
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '1px',
                fontWeight: 700,
                letterSpacing: '.2rem',
                color: 'inherit',
                textDecoration: 'none',
                cursor: 'pointer',
            }}
        >
            Flood<MdOutlineFlood style={{ fontSize: fontSize, marginLeft: '0px' }} />Viewer
        </Typography>
    )
}



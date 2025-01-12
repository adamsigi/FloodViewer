import Typography from "@mui/material/Typography"

export default function StyledLink({ children, href, inNew=true }) {
    return (
        <Typography component='a' href={href} color="primary" target={inNew ? "_blank" : "_self"} sx={{textDecoration: 'none'}}>
            {children}
        </Typography>
    )
}

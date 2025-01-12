import Typography from '@mui/material/Typography'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'

export default function HelpAccordion({ summary, details }) {
    return (
        <Accordion
            elevation={0}
            disableGutters={true}
            sx={{
                backgroundColor: 'inherit',
                color: 'inherit',
                '&::before': {
                    display: 'none',
                },
                p: 0, m: 0,
                '& .MuiAccordionSummary-content': {
                    p: 0, m: 0, display: 'inline'
                },
                '& .MuiAccordionSummary-root': {
                    p: 0, m: 0, minHeight: '20px', display: 'inline'
                },
                '& .MuiAccordionDetails-root': {
                    p: 0, m: 0, pt: 1
                },
            }}
        >
            <AccordionSummary
                aria-controls="panel1-content"
                id="panel1-header"
                sx={{ p: 0 }}
            >
                <Typography variant='caption' sx={{ textDecoration: 'underline' }}>{summary}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ lineHeight: '1' }}>
                <Typography variant='caption'>
                    {details}
                </Typography>
            </AccordionDetails>
        </Accordion>
    )
}

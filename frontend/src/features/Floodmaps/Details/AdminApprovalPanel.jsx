import Stack from "@mui/material/Stack"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import { Z_INDEXES } from "@utils/constants"
import { useFetcher } from "react-router-dom"

export default function AdminApprovalPanel() {
    const fetcher = useFetcher()

    function handleApprove() {
        fetcher.submit(
            { approve: true },
            { method: "PATCH", encType: "application/json" }
        )
    }

    function handleDisapprove() {
        fetcher.submit(
            { approve: false },
            { method: "PATCH", encType: "application/json" }
        )
    }

    return (
        <Box sx={{ backgroundColor: 'white', p: 1, px: 2, m: 1, border: 'solid ', zIndex: Z_INDEXES.OverMUIDialogShadow, }}>
            {!fetcher.data &&
                <>
                    <Typography variant="h6">Do you approve this Job?</Typography>
                    <Stack direction='row' justifyContent='center' alignItems='center' gap={2} sx={{ mt: 1 }}>
                        <Button color='error' disabled={fetcher.state === 'submitting'} onClick={handleDisapprove}>Disapprove</Button>
                        <Button variant='contained' disabled={fetcher.state === 'submitting'} onClick={handleApprove}>Approve</Button>
                    </Stack>
                </>
            }
            {fetcher.data && fetcher.data?.status !== 200 &&
                <Typography color='error' variant="h6">
                    Operation Failed!
                </Typography>
            }
            {fetcher.data && fetcher.data?.status === 200 &&
                <Typography color='primary' variant="h6">
                    Operation Succeeded!
                </Typography>
            }
        </Box>

    )
}
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import { SUCCEEDED_STATUS } from "@utils/constants"
import { TableCellBorderless } from '@components/StyledElements'
import Divider from "@mui/material/Divider"
import { Z_INDEXES } from "@utils/constants"
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export function FloodmapInfoFull({ floodmap }) {
    return (
        <Box sx={{
            position: 'relative',
            zIndex: Z_INDEXES.OverMUIDialogShadow,
            backgroundColor: 'white',
            border: 'solid',
            px: 2,
            py: 1,
            maxWidth: 280,
            overflow: 'auto'
        }}>
            <InfoHeader floodmap={floodmap} isCompact={false} />
            <Divider orientation="horizontal" sx={{ m: '4px' }} />
            <InfoFooter floodmap={floodmap} isCompact={false} />
        </Box>
    )
}

export function FloodmapInfoCompact({ floodmap }) {
    return (
        <Box sx={{
            position: 'relative',
            zIndex: Z_INDEXES.OverMUIDialogShadow,
            maxWidth: 400,
            maxHeight: 120,
            p: 1,
            backgroundColor: 'white',
            m: 1,
            border: 'solid',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            gap: 1.5,
            overflow: 'auto'
        }}>
            <InfoHeader floodmap={floodmap} isCompact={true} />
            <Divider orientation="vertical" flexItem />
            <InfoFooter floodmap={floodmap} isCompact={true} />
        </Box>
    )
}

function InfoHeader({ floodmap, isCompact }) {
    return (
        <Box sx={{ ...(isCompact && { flex: 1, maxHeight: 120 }) }}>
            <Typography variant={isCompact ? 'h6' : 'h5'}>
                {floodmap.name}
            </Typography>
            <Typography variant="subtitle1">
                {dayjs(floodmap.flood_date).utcOffset(0, false).format('D MMM, YYYY HH:mm')}
            </Typography>
        </Box>
    )
}

function InfoFooter({ floodmap, isCompact }) {
    const legendRightPadding = '12px'
    const valueRightPadding = '8px'
    return (
        <Table size="small" aria-label="bounding-box"
            sx={{
                borderRadius: '8px',
                maxWidth: '220px',
                ...(isCompact && { flex: 1 })
            }}>
            <TableBody>
                <TableRow>
                    <TableCellBorderless pr={legendRightPadding}>
                        <Typography variant="subtitle2">Latitude:</Typography>
                    </TableCellBorderless>
                    <TableCellBorderless pr={valueRightPadding}>
                        <Typography variant="subtitle2">{floodmap.bbox.max_lat}</Typography>
                    </TableCellBorderless>
                    <TableCellBorderless pr={valueRightPadding}>
                        <Typography variant="subtitle2">{floodmap.bbox.min_lat}</Typography>
                    </TableCellBorderless>
                </TableRow>
                <TableRow >
                    <TableCellBorderless pr={legendRightPadding}>
                        <Typography variant="subtitle2">Longitude:</Typography>
                    </TableCellBorderless>
                    <TableCellBorderless pr={valueRightPadding}>
                        <Typography variant="subtitle2">{floodmap.bbox.max_lng}</Typography>
                    </TableCellBorderless>
                    <TableCellBorderless pr={valueRightPadding}>
                        <Typography variant="subtitle2">{floodmap.bbox.min_lng}</Typography>
                    </TableCellBorderless>
                </TableRow>
                {floodmap.job.status === SUCCEEDED_STATUS &&
                    <TableRow >
                        <TableCellBorderless pr={legendRightPadding} >
                            <Typography variant="subtitle2">Built At:</Typography>
                        </TableCellBorderless>
                        <TableCellBorderless colSpan={2}>
                            <Typography variant="subtitle2">{dayjs(floodmap.product.built_at).utcOffset(0, false).format('DD/MM/YYYY')}</Typography>
                        </TableCellBorderless>
                    </TableRow>
                }
            </TableBody>
        </Table>
    )
}

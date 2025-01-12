import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import CardActionArea from '@mui/material/CardActionArea'
import Skeleton from '@mui/material/Skeleton'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import LoopIcon from '@mui/icons-material/Loop'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { SUCCEEDED_STATUS, PROGRESSING_STATUS } from "@utils/constants"
import { TableCellBorderless } from '@components/StyledElements'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const VITE_GEOSERVER_URL = import.meta.env.VITE_GEOSERVER_URL

export default function FloodmapCard({ floodmap }) {
     const [loading, setLoading] = useState(true)
     return (
          <>
               <Card
                    sx={(theme) => ({
                         backgroundColor: theme.palette.background.default,
                         border: 0,
                         boxShadow: 0,
                         pb: 1,
                         '#flood-image': {
                              transition: 'transform 0.200s ease-in-out',
                         },
                         '&:hover #flood-image': {
                              transform: 'scale(1.015)',
                              boxShadow: 0,
                         }
                    })}>
                    <CardActionArea
                         disableRipple={true}
                         sx={(theme) => ({
                              p: '3px',
                              '.MuiCardActionArea-focusHighlight': {
                                   backgroundColor: theme.palette.background.default,
                              },
                         })}
                         component={Link}
                         to={`/floodmaps/${floodmap.id}`}
                    >
                         <Box id='img-wrapper' sx={{ overflow: 'clip' }}>
                              {floodmap.job.status === SUCCEEDED_STATUS ?
                                   (
                                        <>
                                             {loading &&
                                                  <CardMedia sx={{ aspectRatio: '16 / 10', borderRadius: 2, overflow: 'clip', display: 'flex', flexDirection: 'column', }}>
                                                       <Skeleton
                                                            variant="rectangular"
                                                            animation="wave"
                                                            sx={{ flex: 1, }}
                                                       />
                                                  </CardMedia>
                                             }
                                             <CardMedia
                                                  id='flood-image'
                                                  component="img"
                                                  image={`${VITE_GEOSERVER_URL}/geoserver/${floodmap.product.geoserver_workspace}/wms?${floodmap.product.thumbnail_url_params}`}
                                                  onLoad={() => setLoading(false)}
                                                  sx={{
                                                       aspectRatio: '16 / 10',
                                                       borderRadius: 2,
                                                       display: loading ? 'none' : 'block',
                                                       objectFit: 'cover'
                                                  }}
                                             />
                                        </>) :
                                   (
                                        floodmap.job.status === PROGRESSING_STATUS ?
                                             (
                                                  <CardMedia sx={(theme) => ({ aspectRatio: '16 / 10', borderRadius: 2, border: `solid ${theme.palette.info.main}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 1, bgcolor: theme.palette.grey[300] })}>
                                                       <LoopIcon color="info" sx={{ fontSize: 80 }} />
                                                       <Typography variant='h5' color='info.main'>Progressing</Typography>
                                                  </CardMedia>
                                             ) :
                                             (
                                                  <CardMedia sx={(theme) => ({ aspectRatio: '16 / 10', borderRadius: 2, border: `solid ${theme.palette.error.main}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 1, bgcolor: theme.palette.grey[300] })}>
                                                       <ErrorOutlineIcon color="error" sx={{ fontSize: 80 }} />
                                                       <Typography variant='h5' color='error'>Failed</Typography>
                                                  </CardMedia>

                                             )
                                   )}
                         </Box>

                         <CardContent sx={{ p: 1, }}>
                              <Typography variant="h5">
                                   {floodmap.name}
                              </Typography>
                              <Typography variant="subtitle1">
                                   {dayjs(floodmap.flood_date).utcOffset(0, false).format('D MMM, YYYY HH:mm')}
                              </Typography>

                              <Table size="small" aria-label="bounding-box"
                                   sx={{
                                        borderRadius: '8px',
                                        maxWidth: '220px'
                                   }}>
                                   <TableBody>
                                        <TableRow>
                                             <TableCellBorderless>
                                                  <Typography variant="subtitle2">Latitude:</Typography>
                                             </TableCellBorderless>
                                             <TableCellBorderless>
                                                  <Typography variant="subtitle2">{floodmap.bbox.max_lat}</Typography>
                                             </TableCellBorderless>
                                             <TableCellBorderless>
                                                  <Typography variant="subtitle2">{floodmap.bbox.min_lat}</Typography>
                                             </TableCellBorderless>
                                        </TableRow>
                                        <TableRow >
                                             <TableCellBorderless>
                                                  <Typography variant="subtitle2">Longitude:</Typography>
                                             </TableCellBorderless>
                                             <TableCellBorderless>
                                                  <Typography variant="subtitle2">{floodmap.bbox.max_lng}</Typography>
                                             </TableCellBorderless>
                                             <TableCellBorderless>
                                                  <Typography variant="subtitle2">{floodmap.bbox.min_lng}</Typography>
                                             </TableCellBorderless>
                                        </TableRow>
                                        {floodmap.job.status === SUCCEEDED_STATUS &&
                                             <TableRow >
                                                  <TableCellBorderless  >
                                                       <Typography variant="subtitle2">Built At:</Typography>
                                                  </TableCellBorderless>
                                                  <TableCellBorderless colSpan={2}>
                                                       <Typography variant="subtitle2">{dayjs(floodmap.product.built_at).utcOffset(0, false).format('DD/MM/YYYY')}</Typography>
                                                  </TableCellBorderless>
                                             </TableRow>
                                        }
                                   </TableBody>
                              </Table>
                         </CardContent>
                    </CardActionArea>
               </Card>
          </>
     )
}

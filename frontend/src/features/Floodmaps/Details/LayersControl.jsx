import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Box from '@mui/material/Box'
import { Z_INDEXES } from '@utils/constants'


export default function LayersControl({ visibleLayers, setVisibleLayers }) {
    return (
        <Box sx={{ backgroundColor: 'white', p: 1, m: 1, border: 'solid ', zIndex: Z_INDEXES.OverMap, }} >
            <FormGroup sx={{ '.MuiCheckbox-root': { p: '6px', }, '.MuiFormControlLabel-root': { m: 0, mr: 1 } }}>
                <FormControlLabel
                    control={
                        <Checkbox checked={visibleLayers.aoi}
                            onChange={(e) => {
                                setVisibleLayers({ ...visibleLayers, aoi: e.target.checked })
                            }}
                        />}
                    label="Area of Interest"
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={visibleLayers.esaWorldCover}
                            onChange={(e) => {
                                setVisibleLayers({ ...visibleLayers, esaWorldCover: e.target.checked })

                            }} />}
                    label="ESA WorldCover 2021"
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={visibleLayers.s1Backscatter}
                            onChange={(e) => {
                                setVisibleLayers({ ...visibleLayers, s1Backscatter: e.target.checked })

                            }} />}
                    label="Sentinel-1 Backscatter"
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={visibleLayers.tScore}
                            onChange={(e) => {
                                setVisibleLayers({ ...visibleLayers, tScore: e.target.checked })

                            }} />}
                    label="T-scores"
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={visibleLayers.floodedRegions}
                            onChange={(e) => {
                                setVisibleLayers({ ...visibleLayers, floodedRegions: e.target.checked })

                            }} />}
                    label="Flooded Regions"
                />
            </FormGroup>
        </Box>
    )
}

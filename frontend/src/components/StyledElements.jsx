import TableCell from '@mui/material/TableCell'
import TextField from '@mui/material/TextField'
import styled from '@mui/material/styles/styled'
import { TextFieldElement } from 'react-hook-form-mui'

export const TextFieldElementNoArrows = styled(TextFieldElement)(() => ({
    'input[type=number]::-webkit-inner-spin-button': {
        'WebkitAppearance': 'none',
        'margin': 0
    },
    'input[type=number]::-webkit-outer-spin-button': {
        'WebkitAppearance': 'none',
        'margin': 0
    }
}))

export const TextFieldNoArrows = styled(TextField)(() => ({
    'input[type=number]::-webkit-inner-spin-button': {
        'WebkitAppearance': 'none',
        'margin': 0
    },
    'input[type=number]::-webkit-outer-spin-button': {
        'WebkitAppearance': 'none',
        'margin': 0
    }
}))

export const TableCellBorderless = styled(TableCell)(({ pt = '2px', pr = '2px', pb = '2px', pl = '2px' }) => ({
    border: 'none',
    paddingTop: pt, 
    paddingRight: pr, 
    paddingBottom: pb, 
    paddingLeft: pl, 
}))

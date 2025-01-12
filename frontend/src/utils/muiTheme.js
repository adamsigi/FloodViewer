import createTheme from '@mui/material/styles/createTheme'

export default createTheme({
    palette: {
        primary: {
            main: '#5a76b5',
            contrastText: '#e0e0e0',
        },
        secondary: {
            main: '#b899d1',
            contrastText: '#e0e0e0',
        },
        text: {
            primary: 'rgb(13, 17, 28)',
            secondary: 'rgb(13, 17, 28)',
            disabled: 'rgba(13, 17, 28, 0.38)',
            hint: 'rgb(129, 9, 75)',
        },
        background: {
            default: '#f1f3f9',
        },

    },
    components: {
        MuiInput: {
            styleOverrides: {
                root: {
                    '&:hover:not(.Mui-disabled):not(.Mui-error):before': {
                        borderBottom: '1px solid black',
                    },
                },
            },
        },
    },
})

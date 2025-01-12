import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuIcon from '@mui/icons-material/Menu'
import MenuItem from '@mui/material/MenuItem'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import ListAltIcon from '@mui/icons-material/ListAlt'
import CreateIcon from '@mui/icons-material/Create'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark'
import FloodViewerLogo from '@components/FloodViewerLogo'
import { Link, useLocation } from 'react-router-dom'
import { MdOutlineFlood } from 'react-icons/md'
import { useIsLoggedIn } from '@services/authService'
import { Z_INDEXES } from '@utils/constants'


const navMenuItems = [
    { label: 'Floodmaps', path: '/floodmaps', icon: <MdOutlineFlood fontSize='24' /> },
    { label: 'Create', path: '/create', icon: <CreateIcon /> },
    { label: 'About', path: '/about', icon: <QuestionMarkIcon /> },
]

const userMenuItems = [
    { label: 'Jobs', path: '/jobs', icon: <ListAltIcon /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
    { label: 'Logout', path: '/logout', icon: <LogoutIcon /> },
]

const loginItem = { label: 'Login', path: '/login' }

export default function FloodViewerNavBar() {
    const location = useLocation()
    const isLoggedIn = useIsLoggedIn()
    const [anchorElNav, setAnchorElNav] = useState(null)
    const [anchorElUser, setAnchorElUser] = useState(null)

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget)
    }
    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget)
    }

    const handleCloseNavMenu = () => {
        setAnchorElNav(null)
    }

    const handleCloseUserMenu = () => {
        setAnchorElUser(null)
    }

    return (
        <AppBar position="static" sx={{ zIndex: Z_INDEXES.NavBar }}>
            <Toolbar disableGutters sx={{ mx: { xs: 1, md: 4 } }}>
                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, px: 1, alignItems: 'center' }}>
                    <FloodViewerLogo variant={'h6'} fontSize="1.6rem" to='/floodmaps' />

                    {navMenuItems.map((navMenuItem, index) => (
                        <Typography
                            key={navMenuItem.label}
                            component={Link}
                            to={navMenuItem.path}
                            onClick={handleCloseNavMenu}
                            sx={{ ml: index === 0 ? 3 : 2, mt: '4px', color: 'white', textDecoration: location.pathname === navMenuItem.path ? "white solid underline" : "none", '&:hover': { fontWeight: '500' } }}
                        >
                            {navMenuItem.label}
                        </Typography>
                    ))}
                </Box>

                <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, }}>
                    <IconButton
                        size="large"
                        aria-label="navigation options"
                        aria-controls="menu-appbar"
                        aria-haspopup="menu"
                        onClick={handleOpenNavMenu}
                        color="inherit"
                        sx={{ p: 1 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorElNav}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        open={Boolean(anchorElNav)}
                        onClose={handleCloseNavMenu}
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            zIndex: Z_INDEXES.NavBar
                        }}
                    >
                        {navMenuItems.map(navMenuItem => (
                            <MenuItem
                                onClick={handleCloseNavMenu}
                                key={navMenuItem.label}
                                selected={location.pathname === navMenuItem.path}
                                component={Link}
                                to={navMenuItem.path}
                                sx={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                            >
                                {navMenuItem.icon} {navMenuItem.label}
                            </MenuItem>
                        ))}
                    </Menu>
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none', alignItems: 'center', justifyContent: 'center' } }}>
                        <FloodViewerLogo variant='h5' fontSize="1.9rem" to='/floodmaps' />
                    </Box>
                </Box>

                <Box sx={{ flexGrow: 0, mt: '4px' }}>
                    {isLoggedIn ?
                        (
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: { xs: '6px', md: '2px' }, }}>
                                <AccountCircleIcon sx={{ fontSize: { xs: 36, md: 40 }, color: 'white', }} />
                            </IconButton>
                        ) :
                        (
                            <Typography
                                component={Link}
                                to={loginItem.path}
                                sx={{ p: 1, color: 'white', textDecoration: location.pathname === loginItem.path ? "white solid underline" : "none", '&:hover': { fontWeight: '500' } }}
                            >
                                {loginItem.label}
                            </Typography>
                        )
                    }
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorElUser}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorElUser)}
                        onClose={handleCloseUserMenu}
                        sx={{ zIndex: Z_INDEXES.NavBar }}
                    >
                        {userMenuItems.map(userMenuItem => (
                            <MenuItem
                                onClick={handleCloseUserMenu}
                                key={userMenuItem.label}
                                selected={location.pathname === userMenuItem.path}
                                component={Link}
                                to={userMenuItem.path}
                                sx={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', }}
                            >
                                {userMenuItem.icon} {userMenuItem.label}
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    )
}

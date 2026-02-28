import React from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Container,
    BottomNavigation,
    BottomNavigationAction,
    Paper
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    UtensilsCrossed,
    ShoppingBag,
    Receipt,
    UserCircle
} from 'lucide-react';

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: 'Menu', icon: <UtensilsCrossed size={20} />, path: '/menu' },
        { label: 'Orders', icon: <ShoppingBag size={20} />, path: '/orders' },
        { label: 'Bill', icon: <Receipt size={20} />, path: '/bill' },
        { label: 'Profile', icon: <UserCircle size={20} />, path: '/profile' },
    ];

    const currentPath = location.pathname;
    const activeValue = navItems.findIndex(item => item.path === currentPath);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#FFFFFF' }}>
            {/* Header */}
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #EEEEEE' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 900, color: '#1A1A1A' }}>
                        RESTAURANTE <Box component="span" sx={{ color: '#FF8C00' }}>APP</Box>
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Container component="main" maxWidth="sm" sx={{ flexGrow: 1, py: 3, pb: 10 }}>
                <Outlet />
            </Container>

            {/* Footer Navigation */}
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
                <BottomNavigation
                    showLabels
                    value={activeValue >= 0 ? activeValue : 0}
                    onChange={(event, newValue) => {
                        navigate(navItems[newValue].path);
                    }}
                    sx={{
                        height: 70,
                        '& .Mui-selected': {
                            color: '#FF8C00 !important',
                            '& .MuiBottomNavigationAction-label': {
                                fontWeight: 700,
                            }
                        },
                        '& .MuiBottomNavigationAction-root': {
                            color: '#757575',
                        }
                    }}
                >
                    {navItems.map((item) => (
                        <BottomNavigationAction
                            key={item.label}
                            label={item.label}
                            icon={item.icon}
                        />
                    ))}
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default MainLayout;

import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider } from '@mui/material';
import { LayoutDashboard, LogOut, ArrowLeft, Settings } from 'lucide-react';
import { getCurrentUser, logoutUser } from '../utils/userStore';

const drawerWidth = 280;

const WaiterLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { label: 'Painel de Mesas', path: '/waiter', icon: <LayoutDashboard size={20} /> },
    ];

    return (
        <Box sx={{ display: 'flex', bgcolor: 'var(--bg-color)', minHeight: '100vh' }}>
            {/* AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    color: 'var(--text-main)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }}
            >
                <Toolbar sx={{ height: 80 }}>
                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
                        Terminal do Garçom
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: '#0F172A', // Darker slate for premium sidebar
                        color: '#FFFFFF',
                        borderRight: 'none',
                        p: 2
                    },
                }}
            >
                <Box sx={{ py: 3, px: 2, mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'var(--primary)', letterSpacing: -1 }}>
                        VITE<span style={{ color: 'white' }}>APP</span>
                    </Typography>
                </Box>

                <Stack spacing={1}>
                    {menuItems.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <ListItemButton
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: '14px',
                                    py: 1.5,
                                    bgcolor: active ? 'rgba(255, 140, 0, 0.15)' : 'transparent',
                                    color: active ? 'var(--primary)' : '#94A3B8',
                                    '&:hover': {
                                        bgcolor: active ? 'rgba(255, 140, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        color: active ? 'var(--primary)' : '#FFF'
                                    },
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{ fontWeight: active ? 800 : 600, fontSize: '0.95rem' }}
                                />
                            </ListItemButton>
                        );
                    })}

                    {getCurrentUser()?.role === 'ADMIN' && (
                        <ListItemButton
                            onClick={() => navigate('/admin')}
                            sx={{
                                borderRadius: '14px', py: 1.5, color: '#94A3B8',
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#FFF' }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Settings size={20} /></ListItemIcon>
                            <ListItemText primary="Painel Admin" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }} />
                        </ListItemButton>
                    )}
                </Stack>

                <Box sx={{ mt: 'auto', pb: 2 }}>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />
                    <ListItemButton
                        onClick={() => {
                            logoutUser();
                            navigate('/menu');
                        }}
                        sx={{
                            borderRadius: '14px', py: 1.5, color: '#F87171',
                            '&:hover': { bgcolor: 'rgba(248, 113, 113, 0.1)', color: '#F87171' }
                        }}
                    >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogOut size={20} /></ListItemIcon>
                        <ListItemText primary="Sair do Sistema" primaryTypographyProps={{ fontWeight: 800, fontSize: '0.95rem' }} />
                    </ListItemButton>
                </Box>
            </Drawer>

            {/* Main Content */}
            <Box
                component="main"
                sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}
                key={location.pathname}
                className="animate-fade-in-up"
            >
                <Toolbar sx={{ height: 80 }} /> {/* Spacer */}
                <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default WaiterLayout;

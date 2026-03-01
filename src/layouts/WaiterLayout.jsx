import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider } from '@mui/material';
import { LayoutDashboard, LogOut, ArrowLeft, Settings } from 'lucide-react';
import { getCurrentUser, logoutUser } from '../utils/userStore';

const drawerWidth = 240;

const WaiterLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Box sx={{ display: 'flex', bgcolor: '#F9FAFB', minHeight: '100vh' }}>
            {/* AppBar */}
            <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, bgcolor: '#FFFFFF', color: '#1A1A1A', elevation: 1, borderBottom: '1px solid #E5E7EB' }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800 }}>
                        Terminal do Garçom
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Drawer */}
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#1A1A1A', color: '#FFFFFF', borderRight: 'none' },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#FF8C00' }}>
                        RESTAURANTE<br /><span style={{ color: 'white' }}>APP</span>
                    </Typography>
                </Toolbar>
                <Divider sx={{ borderColor: '#333' }} />
                <List sx={{ px: 2, pt: 2 }}>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            selected={location.pathname === '/waiter'}
                            onClick={() => navigate('/waiter')}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': { bgcolor: '#FF8C00', color: '#1A1A1A' },
                                '&:hover': { bgcolor: location.pathname === '/waiter' ? '#FF8C00' : '#333' }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LayoutDashboard size={20} /></ListItemIcon>
                            <ListItemText primary="Painel de Mesas" primaryTypographyProps={{ fontWeight: location.pathname === '/waiter' ? 800 : 500 }} />
                        </ListItemButton>
                    </ListItem>

                    {getCurrentUser()?.role === 'ADMIN' && (
                        <ListItem disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => navigate('/admin')}
                                sx={{ borderRadius: 2, color: '#9CA3AF', '&:hover': { bgcolor: '#333', color: '#FFF' } }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Settings size={20} /></ListItemIcon>
                                <ListItemText primary="Voltar ao Admin" />
                            </ListItemButton>
                        </ListItem>
                    )}
                </List>

                <Box sx={{ mt: 'auto', p: 2 }}>
                    <ListItemButton
                        onClick={() => {
                            logoutUser();
                            navigate('/menu');
                        }}
                        sx={{ borderRadius: 2, color: '#FF5252', '&:hover': { bgcolor: '#2D1A1A', color: '#FF5252' } }}
                    >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogOut size={20} /></ListItemIcon>
                        <ListItemText primary="Sair do Sistema" primaryTypographyProps={{ fontWeight: 700 }} />
                    </ListItemButton>
                </Box>
            </Drawer>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, bgcolor: '#F9FAFB', p: 3 }}>
                <Toolbar /> {/* Spacer for fixed AppBar */}
                <Outlet />
            </Box>
        </Box>
    );
};

export default WaiterLayout;

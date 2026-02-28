import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Bill from './pages/Bill';
import Pool from './pages/Pool';
import Profile from './pages/Profile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AdminPortal from './pages/Admin/AdminPortal';
import Management from './pages/Admin/Management';
import Kitchen from './pages/Admin/Kitchen';

// Future pages (placeholder)
const PlaceholderPage = ({ title }) => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#FF8C00' }}>{title}</h2>
        <p>This page is under construction.</p>
    </div>
);

const theme = createTheme({
    palette: {
        primary: {
            main: '#FF8C00', // Orange
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#FFFFFF',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1A1A1A',
            secondary: '#757575',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h5: {
            fontWeight: 900,
        },
        h6: {
            fontWeight: 700,
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: 'none',
                    fontWeight: 700,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
    },
});



// ... theme ...


function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route index element={<Navigate to="/menu" replace />} />
                        <Route path="menu" element={<Menu />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="bill" element={<Bill />} />
                        <Route path="pool/:poolId" element={<Pool />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                    <Route path="auth" element={<AuthLayout />}>
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                    </Route>

                    <Route path="admin">
                        <Route index element={<AdminPortal />} />
                        <Route path="management" element={<Management />} />
                        <Route path="kitchen" element={<Kitchen />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
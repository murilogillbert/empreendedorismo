import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { ChevronLeft } from 'lucide-react';

const AuthLayout = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#FAFAFA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 3,
            py: 8,
            background: 'radial-gradient(circle at top right, #FFF5EB 0%, #FFFFFF 50%, #F5F5F5 100%)'
        }}>
            <Container maxWidth="xs" sx={{ p: 0 }}>
                <Card
                    elevation={0}
                    sx={{
                        p: { xs: 4, sm: 6 },
                        borderRadius: '40px',
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.03)',
                        textAlign: 'center'
                    }}
                >
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h3" sx={{ fontWeight: 1000, color: 'var(--primary)', letterSpacing: -2, mb: 1 }}>
                            VITE<span style={{ color: 'var(--text-main)' }}>APP</span>
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontWeight: 600, px: 2, lineHeight: 1.6 }}>
                            Acesse sua conta para gerenciar seu restaurante com elegância.
                        </Typography>
                    </Box>
                    <Outlet />
                </Card>
            </Container>
        </Box>
    );
};

export default AuthLayout;

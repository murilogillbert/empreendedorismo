import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { ChevronLeft } from 'lucide-react';

const AuthLayout = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF', pt: 4 }}>
            <Container maxWidth="xs" sx={{ pt: 4, pb: 8 }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#FF8C00' }}>
                        Restaurante
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Sua experiência gastronômica premium
                    </Typography>
                </Box>
                <Outlet />
            </Container>
        </Box>
    );
};

export default AuthLayout;

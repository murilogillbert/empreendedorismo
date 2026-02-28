import React, { useState } from 'react';
import { Box, Card, Typography, Stack, Button, TextField, Container, InputAdornment, IconButton } from '@mui/material';
import { ChefHat, Settings, ArrowLeft, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AdminPortal = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode'); // 'mgmt' or 'kit'

    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        // Specific requirement: admin/admin for management
        if (mode === 'mgmt') {
            if (loginData.username === 'admin' && loginData.password === 'admin') {
                navigate('/admin/management');
            } else {
                alert('Credenciais de Gerente inválidas!');
            }
        } else if (mode === 'kit') {
            // Let's use kitchen/kitchen for kitchen
            if (loginData.username === 'kitchen' && loginData.password === 'kitchen') {
                navigate('/admin/kitchen');
            } else {
                alert('Credenciais de Cozinha inválidas!');
            }
        }
    };

    if (!mode) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#F8F9FA', py: 8 }}>
                <Container maxWidth="sm">
                    <Typography variant="h4" align="center" sx={{ fontWeight: 900, mb: 6, color: '#1A1A1A' }}>
                        Portal Administrativo
                    </Typography>

                    <Stack spacing={3}>
                        <Card
                            onClick={() => navigate('/admin?mode=mgmt')}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                cursor: 'pointer',
                                transition: '0.3s',
                                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6, borderColor: '#FF8C00' },
                                border: '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                            }}
                        >
                            <Box sx={{ bgcolor: '#FFF5E6', p: 2, borderRadius: 3 }}>
                                <Settings size={40} color="#FF8C00" />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Gerenciamento</Typography>
                                <Typography variant="body2" color="text.secondary">Controle de cardápio, KPIs e relatórios</Typography>
                            </Box>
                        </Card>

                        <Card
                            onClick={() => navigate('/admin?mode=kit')}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                cursor: 'pointer',
                                transition: '0.3s',
                                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6, borderColor: '#1A1A1A' },
                                border: '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                            }}
                        >
                            <Box sx={{ bgcolor: '#F0F0F0', p: 2, borderRadius: 3 }}>
                                <ChefHat size={40} color="#1A1A1A" />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Cozinha</Typography>
                                <Typography variant="body2" color="text.secondary">Painel Kanban de pedidos em tempo real</Typography>
                            </Box>
                        </Card>

                        <Button
                            startIcon={<ArrowLeft />}
                            onClick={() => navigate('/menu')}
                            sx={{ color: '#757575', fontWeight: 700 }}
                        >
                            Voltar ao Menu Principal
                        </Button>
                    </Stack>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#FFFFFF' }}>
            <Container maxWidth="xs">
                <IconButton onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
                    <ArrowLeft />
                </IconButton>
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                        Login {mode === 'mgmt' ? 'Gerente' : 'Cozinha'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Área restrita. Identifique-se.
                    </Typography>
                </Box>

                <form onSubmit={handleLogin}>
                    <Stack spacing={3}>
                        <TextField
                            label="Usuário"
                            fullWidth
                            required
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><User size={20} /></InputAdornment>
                            }}
                        />
                        <TextField
                            label="Senha"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Lock size={20} /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{
                                height: 56,
                                bgcolor: mode === 'mgmt' ? '#FF8C00' : '#1A1A1A',
                                fontWeight: 800,
                                '&:hover': { bgcolor: mode === 'mgmt' ? '#E67E00' : '#000000' }
                            }}
                        >
                            Acessar {mode === 'mgmt' ? 'Dashboard' : 'Painel'}
                        </Button>
                    </Stack>
                </form>
            </Container>
        </Box>
    );
};

export default AdminPortal;

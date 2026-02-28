import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, Stack, Typography, InputAdornment, IconButton, Box, Alert, CircularProgress } from '@mui/material';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { loginUser } from '../../utils/userStore';

const Login = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await loginUser(formData);
            navigate('/profile');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack spacing={4}>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                    Bem-vindo de volta
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Entre com suas credenciais para continuar
                </Typography>
            </Box>

            <form onSubmit={handleLogin}>
                <Stack spacing={3}>
                    <TextField
                        label="E-mail"
                        fullWidth
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Mail size={20} color="#757575" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        label="Senha"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock size={20} color="#757575" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                        sx={{
                            height: 56,
                            bgcolor: '#1A1A1A',
                            '&:hover': { bgcolor: '#000000' },
                            '&.Mui-disabled': {
                                bgcolor: '#4D4D4D',
                                color: '#FFFFFF'
                            }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                    </Button>
                </Stack>
            </form>

            {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            <Typography variant="body2" sx={{ textAlign: 'center' }}>
                Não tem uma conta?{' '}
                <Link to="/auth/register" style={{ color: '#FF8C00', fontWeight: 700, textDecoration: 'none' }}>
                    Cadastre-se
                </Link>
            </Typography>
        </Stack>
    );
};

// Wrapper Box since it's used as a component
const LoginWrapper = () => (
    <Box sx={{ width: '100%' }}>
        <Login />
    </Box>
);

export default LoginWrapper;

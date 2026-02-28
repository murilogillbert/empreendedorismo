import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, Stack, Typography, InputAdornment, Box, Alert, CircularProgress } from '@mui/material';
import { User, Mail, Lock, Phone } from 'lucide-react';
import { registerUser } from '../../utils/userStore';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await registerUser(formData);
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
                    Criar Conta
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Junte-se a nós para uma melhor experiência
                </Typography>
            </Box>

            <form onSubmit={handleRegister}>
                <Stack spacing={2.5}>
                    <TextField
                        label="Nome Completo"
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <User size={20} color="#757575" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        label="E-mail"
                        type="email"
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
                        label="Telefone"
                        fullWidth
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Phone size={20} color="#757575" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        label="Senha"
                        type="password"
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
                            bgcolor: '#FF8C00',
                            fontWeight: 800,
                            '&:hover': { bgcolor: '#E67E00' },
                            '&.Mui-disabled': {
                                bgcolor: '#FFB84D',
                                color: '#FFFFFF'
                            }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Criar Minha Conta'}
                    </Button>
                </Stack>
            </form>

            {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            <Typography variant="body2" sx={{ textAlign: 'center' }}>
                Já tem uma conta?{' '}
                <Link to="/auth/login" style={{ color: '#1A1A1A', fontWeight: 700, textDecoration: 'none' }}>
                    Fazer Login
                </Link>
            </Typography>
        </Stack>
    );
};

export default Register;

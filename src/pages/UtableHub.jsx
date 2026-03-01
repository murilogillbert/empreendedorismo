import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, Stack, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { MapPin, Navigation, Camera, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ky from 'ky';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4242';

const UtableHub = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [locationError, setLocationError] = useState(null);
    const [activeRadius, setActiveRadius] = useState(3);

    // QR Code scanner mock state
    const [scanDialogOpen, setScanDialogOpen] = useState(false);
    const [mockQrUrl, setMockQrUrl] = useState('');

    const fetchRestaurants = async (lat, lng, radius) => {
        setLoading(true);
        try {
            const data = await ky.get(`${BASE_URL}/api/restaurants/nearby?lat=${lat}&lng=${lng}&radiusKm=${radius}`).json();
            setRestaurants(data);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            setLocationError("Não foi possível carregar os restaurantes.");
        } finally {
            setLoading(false);
        }
    };

    const handleLocation = (radius = activeRadius) => {
        setActiveRadius(radius);
        setLocationError(null);
        setLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchRestaurants(latitude, longitude, radius);
                },
                (error) => {
                    console.error("Geologia error", error);
                    // Fallback para Av. Paulista para fins de demonstração se o user negar
                    setLocationError("Localização não permitida. Usando local padrão (Av. Paulista, SP).");
                    fetchRestaurants(-23.561414, -46.656461, radius);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setLocationError("Geolocalização não suportada.");
            setLoading(false);
        }
    };

    useEffect(() => {
        handleLocation(3); // Inicia com 3km
    }, []);

    const handleScanMock = () => {
        if (!mockQrUrl) return;

        // Expected mock form: /restaurante-demo/MESA-01/menu
        navigate(mockQrUrl);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', pb: 10 }}>
            {/* Header */}
            <Box sx={{
                bgcolor: '#FFFFFF',
                pt: 6, pb: 2, px: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -1 }}>
                    <span style={{ color: '#FF8C00' }}>u</span>table
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/profile')}
                    sx={{
                        borderRadius: '50%',
                        minWidth: 40, height: 40, p: 0,
                        borderColor: '#E5E7EB',
                        color: '#4B5563'
                    }}
                >
                    <User size={20} />
                </Button>
            </Box>

            <Box sx={{ px: 3, mt: 4 }}>
                {/* Scan Action */}
                <Card sx={{
                    p: 3, mb: 4,
                    borderRadius: 4,
                    bgcolor: '#1A1A1A',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    boxShadow: '0 10px 25px rgba(26,26,26,0.2)'
                }}>
                    <Box sx={{
                        width: 60, height: 60,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Camera size={30} color="#FF8C00" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center' }}>
                        Já está em um restaurante?
                    </Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setScanDialogOpen(true)}
                        sx={{
                            bgcolor: '#FF8C00',
                            color: 'white',
                            fontWeight: 800,
                            borderRadius: 3,
                            height: 48,
                            '&:hover': { bgcolor: '#E67E00' }
                        }}
                    >
                        Escanear QR Code da Mesa
                    </Button>
                </Card>

                <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: '#1A1A1A' }}>
                    Restaurantes Próximos
                </Typography>

                {/* Radius Filters */}
                <Stack direction="row" spacing={1} mb={3}>
                    {[3, 5, 10].map(radius => (
                        <Chip
                            key={radius}
                            label={`Até ${radius}km`}
                            onClick={() => handleLocation(radius)}
                            sx={{
                                fontWeight: 800,
                                borderRadius: 2,
                                bgcolor: activeRadius === radius ? '#FF8C00' : '#FFF3E0',
                                color: activeRadius === radius ? 'white' : '#FF8C00',
                                '&:hover': { bgcolor: activeRadius === radius ? '#E67E00' : '#FFE0B2' }
                            }}
                        />
                    ))}
                </Stack>

                {locationError && (
                    <Typography color="error" variant="caption" sx={{ display: 'block', mb: 2, fontWeight: 700 }}>
                        {locationError}
                    </Typography>
                )}

                {/* Restaurant List */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <CircularProgress color="primary" />
                    </Box>
                ) : restaurants.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, color: '#6B7280' }}>
                        <MapPin size={40} style={{ margin: '0 auto', opacity: 0.5, marginBottom: 10 }} />
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            Nenhum restaurante encontrado num raio de {activeRadius}km.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {restaurants.map(rest => (
                            <Card
                                key={rest.id_restaurante}
                                onClick={() => navigate(`/${rest.slug}/menu`)}
                                sx={{
                                    p: 2, borderRadius: 3,
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                    cursor: 'pointer',
                                    '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>{rest.name}</Typography>
                                <Stack direction="row" alignItems="center" gap={1} mt={1} color="text.secondary">
                                    <MapPin size={14} />
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{rest.address || 'Endereço não informado'}</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" gap={1} mt={0.5} color="#FF8C00">
                                    <Navigation size={14} />
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>a {rest.distance} km de distância</Typography>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Mock QR Scanner Dialog */}
            <Dialog open={scanDialogOpen} onClose={() => setScanDialogOpen(false)} fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 900, textAlign: 'center' }}>Escanear QR Code</DialogTitle>
                <DialogContent>
                    <Box sx={{ width: '100%', height: 200, bgcolor: '#000', borderRadius: 3, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="white" variant="caption">Câmera ativa simulada</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>Simular leitura de URL:</Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Ex: /restaurante-demo/MESA-01/menu"
                        value={mockQrUrl}
                        onChange={(e) => setMockQrUrl(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </DialogContent>
                <DialogActions sx={{ pb: 2, justifyContent: 'center' }}>
                    <Button onClick={() => setScanDialogOpen(false)} sx={{ color: '#757575', fontWeight: 700 }}>Cancelar</Button>
                    <Button onClick={handleScanMock} variant="contained" sx={{ bgcolor: '#FF8C00', fontWeight: 700, borderRadius: 2 }}>Confirmar</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default UtableHub;

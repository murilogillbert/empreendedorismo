import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardActionArea, CardContent, CircularProgress, Chip, Stack } from '@mui/material';
import { Users, Receipt, PlayCircle } from 'lucide-react';
import ky from 'ky';
import { useNavigate } from 'react-router-dom';

const WaiterDashboard = () => {
    const navigate = useNavigate();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTablesInfo = async () => {
            try {
                // To display tables and their current session status, we need a new backend endpoint
                // or we can mock the UI until we create it.
                // For now, let's call a hypothetical endpoint that we'll build next.
                const data = await ky.get('http://localhost:4242/api/waiter/tables').json();
                setTables(data);
            } catch (err) {
                console.error("Error fetching tables for waiter:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTablesInfo();
        const intervalId = setInterval(fetchTablesInfo, 10000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) return <Box sx={{ display: 'flex', mt: 10, justifyContent: 'center' }}><CircularProgress color="warning" /></Box>;

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 4, color: '#1A1A1A' }}>Gestão de Salão</Typography>

            <Grid container spacing={3}>
                {tables.map(table => {
                    const isOpen = table.status === 'ABERTA';
                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={table.mesa_id}>
                            <Card
                                elevation={isOpen ? 3 : 0}
                                sx={{
                                    borderRadius: 4,
                                    border: isOpen ? '2px solid #FF8C00' : '2px dashed #E5E7EB',
                                    bgcolor: isOpen ? '#FFF' : '#F9FAFB',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)' }
                                }}
                            >
                                <CardActionArea onClick={() => navigate(`/waiter/table/${table.mesa_id}`)} sx={{ p: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>{table.identificador}</Typography>
                                        <Chip
                                            label={isOpen ? 'Ocupada' : 'Livre'}
                                            size="small"
                                            sx={{
                                                fontWeight: 800,
                                                bgcolor: isOpen ? '#FFF5E6' : '#EFF6FF',
                                                color: isOpen ? '#FF8C00' : '#3B82F6'
                                            }}
                                        />
                                    </Stack>

                                    <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                            <Users size={16} />
                                            <Typography variant="body2">Capacidade: {table.capacidade}</Typography>
                                        </Box>
                                        {isOpen && (
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                    <Receipt size={16} />
                                                    <Typography variant="body2">Pedidos Totais: {table.total_pedidos}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#2e7d32' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Total Parcial: R$ {(parseFloat(table.total_conta) || 0).toFixed(2)}</Typography>
                                                </Box>
                                            </>
                                        )}
                                        {!isOpen && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#9CA3AF', mt: 1 }}>
                                                <PlayCircle size={16} />
                                                <Typography variant="body2">Toque para abrir mesa</Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};

export default WaiterDashboard;

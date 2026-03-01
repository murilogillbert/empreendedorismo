import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    Stack,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Paper,
    Chip
} from '@mui/material';
import { ArrowLeft, Calendar, MapPin, Receipt, CreditCard, CheckCircle2 } from 'lucide-react';
import { fetchSessionDetails } from '../utils/userStore';

const SessionDetail = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const data = await fetchSessionDetails(sessionId);
                setDetails(data);
            } catch (err) {
                console.error(err);
                alert('Erro ao carregar detalhes da sessão.');
                navigate('/profile');
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [sessionId, navigate]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    if (!details) return null;

    const { session, orders, payments } = details;
    const totalConsumido = orders.reduce((acc, o) => acc + (parseFloat(o.final_price) * o.quantidade), 0);

    return (
        <Box sx={{ pb: 8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <IconButton onClick={() => navigate('/profile')} sx={{ mr: 2 }}>
                    <ArrowLeft />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>Detalhes da Visita</Typography>
            </Box>

            {/* Header Info */}
            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #F0F0F0', mb: 3 }}>
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, bgcolor: '#FFF5E6', borderRadius: 2, color: '#FF8C00' }}>
                            <MapPin size={24} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Mesa {session.identificador_mesa}</Typography>
                            <Typography variant="body2" color="text.secondary">Restaurante Principal</Typography>
                        </Box>
                        <Box sx={{ ml: 'auto' }}>
                            <Chip
                                label={session.status}
                                size="small"
                                color={session.status === 'FECHADA' ? 'success' : 'warning'}
                                sx={{ fontWeight: 700 }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={18} color="#757575" />
                        <Typography variant="body2" color="text.secondary">
                            {new Date(session.criado_em).toLocaleString('pt-BR')}
                        </Typography>
                    </Box>
                </Stack>
            </Card>

            {/* Pedidos */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt size={22} color="#FF8C00" /> Itens Consumidos
            </Typography>
            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #F0F0F0', mb: 3, overflow: 'hidden' }}>
                <List disablePadding>
                    {orders.map((item, idx) => (
                        <React.Fragment key={item.id_pedido_item}>
                            <ListItem sx={{ py: 2 }}>
                                <ListItemText
                                    primary={<Typography sx={{ fontWeight: 700 }}>{item.quantidade}x {item.nome}</Typography>}
                                    secondary={item.observacoes ? `"${item.observacoes}"` : null}
                                />
                                <Typography sx={{ fontWeight: 800 }}>
                                    R$ {(parseFloat(item.final_price) * item.quantidade).toFixed(2)}
                                </Typography>
                            </ListItem>
                            {idx < orders.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                    <Box sx={{ p: 2, bgcolor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 700 }}>Subtotal da Mesa</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>R$ {totalConsumido.toFixed(2)}</Typography>
                    </Box>
                </List>
            </Card>

            {/* Pagamentos */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCard size={22} color="#FF8C00" /> Resumo de Pagamentos
            </Typography>
            <Stack spacing={2}>
                {payments.map((p, idx) => (
                    <Paper key={idx} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E8F5E9', bgcolor: '#F9FFF9' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <CheckCircle2 size={20} color="#2e7d32" />
                                <Box>
                                    <Typography sx={{ fontWeight: 700 }}>{p.user_name || p.nome_contribuinte}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Pago em {new Date(p.criado_em).toLocaleTimeString('pt-BR')}
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography sx={{ fontWeight: 800, color: '#2e7d32' }}>
                                + R$ {parseFloat(p.valor).toFixed(2)}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
                {payments.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Nenhum pagamento registrado nesta sessão.
                    </Typography>
                )}
            </Stack>
        </Box>
    );
};

export default SessionDetail;

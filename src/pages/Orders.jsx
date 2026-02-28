import React, { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Divider,
    Stack,
    IconButton,
    Menu,
    MenuItem as MuiMenuItem
} from '@mui/material';
import { MoreVertical, CheckCircle2, Clock, Utensils, AlertCircle, XCircle } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../utils/orderStore';

const statusColors = {
    'Recebido': { color: '#757575', icon: <Clock size={16} />, bg: '#F5F5F5' },
    'Preparando': { color: '#0288d1', icon: <Utensils size={16} />, bg: '#e1f5fe' },
    'Pronto': { color: '#2e7d32', icon: <CheckCircle2 size={16} />, bg: '#e8f5e9' },
    'Entregue': { color: '#ed6c02', icon: <AlertCircle size={16} />, bg: '#fff3e0' },
    'Cancelado': { color: '#d32f2f', icon: <XCircle size={16} />, bg: '#ffebee' }
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            const data = await getOrders();
            setOrders(data);
            setLoading(false);
        };
        fetchOrders();
    }, []);

    const handleMenuOpen = (event, id) => {
        setAnchorEl(event.currentTarget);
        setSelectedOrderId(id);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedOrderId(null);
    };

    const handleStatusChange = async (newStatus) => {
        await updateOrderStatus(selectedOrderId, newStatus);
        const updated = await getOrders(); // Refresh list from server
        setOrders(updated);
        handleMenuClose();
    };

    if (loading) {
        return <Box sx={{ textAlign: 'center', mt: 10 }}><Typography>Carregando pedidos...</Typography></Box>;
    }

    if (orders.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h6" color="text.secondary">
                    Nenhum pedido realizado ainda.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Vá ao Menu e escolha pratos deliciosos!
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
                Acompanhe seu Pedido
            </Typography>

            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {orders.map((order, index) => (
                    <React.Fragment key={`${order.id}-${order.timestamp}`}>
                        <ListItem
                            alignItems="flex-start"
                            sx={{ px: 0, py: 2 }}
                            secondaryAction={
                                <IconButton edge="end" onClick={(e) => handleMenuOpen(e, order.id)}>
                                    <MoreVertical size={20} />
                                </IconButton>
                            }
                        >
                            <ListItemAvatar sx={{ minWidth: 70 }}>
                                <Avatar
                                    variant="rounded"
                                    src={order.image}
                                    sx={{ width: 56, height: 56, borderRadius: 2 }}
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                            {order.quantity}x {order.name}
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FF8C00' }}>
                                            R$ {(order.finalPrice || order.price).toFixed(2)}
                                        </Typography>
                                    </Stack>
                                }
                                secondary={
                                    <Box sx={{ mt: 0.5 }}>
                                        {order.selectedAddons && order.selectedAddons.length > 0 && (
                                            <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                                                {order.selectedAddons.map((addon, i) => (
                                                    <Chip
                                                        key={i}
                                                        label={`+ ${addon.name}`}
                                                        size="small"
                                                        sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#FFF8F0', color: '#FF8C00', fontWeight: 700 }}
                                                    />
                                                ))}
                                            </Stack>
                                        )}
                                        {order.observations && (
                                            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', mb: 1, color: 'text.secondary' }}>
                                                Obs: "{order.observations}"
                                            </Typography>
                                        )}
                                        <Chip
                                            icon={statusColors[order.status]?.icon}
                                            label={order.status}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: statusColors[order.status]?.bg,
                                                color: statusColors[order.status]?.color,
                                                '& .MuiChip-icon': { color: 'inherit' }
                                            }}
                                        />
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                            Vite Restaurante • {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                        {index < orders.length - 1 && <Divider component="li" sx={{ borderStyle: 'dashed' }} />}
                    </React.Fragment>
                ))}
            </List>

            {/* Menu para trocar status (Simulação) */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' } }}
            >
                <Typography variant="overline" sx={{ px: 2, py: 1, fontWeight: 800 }}>Mudar Status</Typography>
                <MuiMenuItem onClick={() => handleStatusChange('Recebido')}>Recebido</MuiMenuItem>
                <MuiMenuItem onClick={() => handleStatusChange('Preparando')}>Preparando</MuiMenuItem>
                <MuiMenuItem onClick={() => handleStatusChange('Pronto')}>Pronto</MuiMenuItem>
                <MuiMenuItem onClick={() => handleStatusChange('Entregue')}>Entregue</MuiMenuItem>
                <MuiMenuItem onClick={() => handleStatusChange('Cancelado')}>Cancelado</MuiMenuItem>
            </Menu>
        </Box>
    );
};

export default Orders;

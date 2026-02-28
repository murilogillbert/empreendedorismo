import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    Stack,
    TextField,
    Button,
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    IconButton
} from '@mui/material';
import {
    Mail,
    Phone,
    History,
    HelpCircle,
    LogOut,
    ChevronDown,
    Edit2,
    CheckCircle2
} from 'lucide-react';
import { getCurrentUser, logoutUser, saveUser, getOrderHistory } from '../utils/userStore';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            navigate('/auth/login');
        } else {
            setUser(currentUser);
            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || ''
            });
            setHistory(getOrderHistory());
        }
    }, [navigate]);

    const handleLogout = () => {
        logoutUser();
        navigate('/auth/login');
    };

    const handleSave = () => {
        const updatedUser = { ...user, ...formData };
        saveUser(updatedUser);
        setUser(updatedUser);
        setIsEditing(false);
    };

    if (!user) return null;

    const faqs = [
        { q: 'Como acompanho meu pedido?', a: 'Você pode ver o status em tempo real na aba "Orders" no menu inferior.' },
        { q: 'Quais as formas de pagamento?', a: 'Aceitamos cartões via Stripe, Pix e pagamento direto no balcão.' },
        { q: 'Como funciona a divisão de conta?', a: 'Na aba "Bill", você pode criar um Pool de Pagamento e compartilhar o QR Code com seus amigos.' },
        { q: 'Posso cancelar um pedido?', a: 'Pedidos podem ser cancelados enquanto o status for "Recebido". Após isso, entre em contato com um garçom.' }
    ];

    return (
        <Box sx={{ pb: 8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>Meu Perfil</Typography>
                <IconButton onClick={handleLogout} color="error">
                    <LogOut size={24} />
                </IconButton>
            </Box>

            {/* User Info Card */}
            <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #F0F0F0', mb: 4 }}>
                <Stack spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: '#FF8C00', fontSize: '1.5rem', fontWeight: 800 }}>
                            {user.name?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                            {isEditing ? (
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    sx={{ '& input': { fontWeight: 800, fontSize: '1.25rem' } }}
                                />
                            ) : (
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>{user.name}</Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">Cliente Premium</Typography>
                        </Box>
                        <IconButton onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                            {isEditing ? <CheckCircle2 size={24} color="#2e7d32" /> : <Edit2 size={20} />}
                        </IconButton>
                    </Box>

                    <Divider />

                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Mail size={18} color="#757575" />
                            {isEditing ? (
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            ) : (
                                <Typography variant="body2">{user.email}</Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Phone size={18} color="#757575" />
                            {isEditing ? (
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            ) : (
                                <Typography variant="body2">{user.phone || 'Adicionar telefone'}</Typography>
                            )}
                        </Box>
                    </Stack>
                </Stack>
            </Card>

            {/* History Section */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <History size={22} color="#FF8C00" /> Histórico de Pedidos
            </Typography>
            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #F0F0F0', mb: 4, overflow: 'hidden' }}>
                <List disablePadding>
                    {history.map((order, idx) => (
                        <React.Fragment key={order.id}>
                            <ListItem sx={{ py: 2 }}>
                                <ListItemText
                                    primary={<Typography sx={{ fontWeight: 700 }}>{order.id}</Typography>}
                                    secondary={order.date}
                                />
                                <Stack alignItems="flex-end" spacing={0.5}>
                                    <Typography sx={{ fontWeight: 800 }}>R$ {order.total.toFixed(2)}</Typography>
                                    <Chip label={order.status} size="small" color="success" variant="outlined" sx={{ fontWeight: 700, height: 20 }} />
                                </Stack>
                            </ListItem>
                            {idx < history.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Card>

            {/* FAQ Section */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HelpCircle size={22} color="#FF8C00" /> FAQ e Ajuda
            </Typography>
            <Box>
                {faqs.map((faq, index) => (
                    <Accordion key={index} elevation={0} sx={{ mb: 1, '&:before': { display: 'none' }, border: '1px solid #F0F0F0', borderRadius: '12px !important', overflow: 'hidden' }}>
                        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{faq.q}</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Typography variant="body2" color="text.secondary">{faq.a}</Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    );
};

export default Profile;

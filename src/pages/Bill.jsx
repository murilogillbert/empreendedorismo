import React, { useState, useEffect } from 'react';
import ky from 'ky';
import {
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    Divider,
    Stack,
    Button,
    Slider,
    TextField,
    Paper,
    Card,
    InputAdornment,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import { CreditCard, Users2, Copy, Share2, QrCode } from 'lucide-react';
import { getOrders, createPool, getPoolBySession } from '../utils/orderStore';
import { getTableSession } from '../utils/tableStore';
import { QRCodeSVG } from 'qrcode.react';

const Bill = () => {
    const [orders, setOrders] = useState([]);
    const [waiterTipPercent, setWaiterTipPercent] = useState(10);
    const [myPayment, setMyPayment] = useState('');
    const [pool, setPool] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    useEffect(() => {
        const fetchOrdersAndPool = async () => {
            const session = getTableSession();
            if (!session) return;

            const allOrders = await getOrders(session.sessionId);
            const activeOrders = allOrders.filter(o => o.status === 'Entregue' || o.status === 'Pronto' || o.status === 'Recebido' || o.status === 'Preparando');
            setOrders(activeOrders);

            const existingPool = await getPoolBySession(session.sessionId);
            if (existingPool) {
                setPool(existingPool);
            }
        };

        // Initial fetch
        fetchOrdersAndPool();

        // Poll every 15 seconds
        const intervalId = setInterval(() => {
            fetchOrdersAndPool();
        }, 15000);

        return () => clearInterval(intervalId);
    }, []);

    const subtotal = orders.reduce((acc, item) => acc + (parseFloat(item.finalPrice ?? item.price ?? 0) * (item.quantity ?? item.quantidade ?? 1)), 0);
    const waiterTip = subtotal * (waiterTipPercent / 100);
    const appTax = subtotal * 0.01;
    const total = subtotal + waiterTip + appTax;

    const handleCreatePool = async () => {
        const payAmount = parseFloat(myPayment) || 0;
        if (payAmount >= total) {
            alert("Para pagar o valor total, use o botão 'Pagar Integral'");
            return;
        }
        const session = getTableSession();
        if (!session) {
            alert('Não há mesa vinculada.');
            return;
        }
        try {
            const newPool = await createPool(total, payAmount, session.sessionId);
            setPool(newPool);
        } catch (e) {
            alert(e.message || 'Erro ao criar Pool.');
        }
    };

    const handleStripeCheckout = async (amountToPay) => {
        try {
            const data = await ky.post('http://localhost:4242/create-checkout-session', {
                json: {
                    items: orders.map(o => ({
                        name: o.name + (o.selectedAddons?.length ? ` (+ ${o.selectedAddons.map(a => a.name).join(', ')})` : ''),
                        price: parseFloat(o.finalPrice ?? o.price ?? 0),
                        quantity: o.quantity ?? o.quantidade ?? 1
                    })),
                    tip: waiterTip,
                    appTax: appTax
                }
            }).json();

            window.location.href = data.url;
        } catch (err) {
            console.error("Stripe Checkout Error:", err);
            alert(`Erro no pagamento: ${err.message}. Verifique se o servidor backend está rodando.`);
        }
    };

    const poolUrl = pool ? `${window.location.origin}/pool/${pool.id}` : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(poolUrl);
        setOpenSnackbar(true);
    };

    if (orders.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h6" color="text.secondary">Sua conta está vazia.</Typography>
                <Typography variant="body2" color="text.secondary">Apenas itens marcados como 'Entregue' ou 'Pronto' aparecem aqui.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
                Minha Conta
            </Typography>

            <Card elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #F0F0F0' }}>
                <List disablePadding>
                    {orders.map((item, index) => (
                        <React.Fragment key={index}>
                            <ListItem sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}>
                                <ListItemText
                                    primary={<Typography component="span" sx={{ fontWeight: 700 }}>{item.quantity ?? item.quantidade ?? 1}x {item.name}</Typography>}
                                    secondary={
                                        <Box component="span" sx={{ display: 'block' }}>
                                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Extras: {item.selectedAddons.map(a => a.name).join(', ')}
                                                </Typography>
                                            )}
                                            {item.observations && (
                                                <Typography component="span" variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
                                                    "{item.observations}"
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                                <Typography sx={{ fontWeight: 800 }}>R$ {(parseFloat(item.finalPrice ?? item.price ?? 0) * (item.quantity ?? item.quantidade ?? 1)).toFixed(2)}</Typography>
                            </ListItem>
                        </React.Fragment>
                    ))}

                    <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                    <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography color="text.secondary">Subtotal</Typography>
                            <Typography sx={{ fontWeight: 600 }}>R$ {subtotal.toFixed(2)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="text.secondary">Gorjeta Garçom ({waiterTipPercent}%)</Typography>
                            <Typography sx={{ fontWeight: 600 }}>R$ {waiterTip.toFixed(2)}</Typography>
                        </Box>

                        <Box sx={{ px: 1 }}>
                            <Slider
                                value={waiterTipPercent}
                                onChange={(e, val) => setWaiterTipPercent(val)}
                                min={0}
                                max={25}
                                step={1}
                                valueLabelDisplay="auto"
                                sx={{ color: '#FF8C00' }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography color="text.secondary">Taxa do App (1%)</Typography>
                            <Typography sx={{ fontWeight: 600 }}>R$ {appTax.toFixed(2)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '2px solid #F0F0F0' }}>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>Total Geral</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#FF8C00' }}>R$ {total.toFixed(2)}</Typography>
                        </Box>
                    </Stack>
                </List>
            </Card>

            {!pool ? (
                <Card elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #F0F0F0', bgcolor: '#F9F9F9' }}>
                    <Stack spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Users2 size={24} color="#FF8C00" /> Dividir Conta (Pool)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Quanto você deseja pagar agora? O restante será deixado no Pool para outros pagarem via QR Code.
                        </Typography>

                        <TextField
                            fullWidth
                            label="Seu Valor (R$)"
                            type="number"
                            size="small"
                            value={myPayment}
                            onChange={(e) => setMyPayment(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                            }}
                        />

                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<Share2 size={20} />}
                            onClick={handleCreatePool}
                            sx={{
                                borderRadius: 3,
                                borderColor: '#FF8C00',
                                color: '#FF8C00',
                                fontWeight: 700,
                                '&:hover': { borderColor: '#E67E00', bgcolor: '#FFF5E6' }
                            }}
                        >
                            Criar Pool de Pagamento
                        </Button>
                    </Stack>
                </Card>
            ) : (
                <Card elevation={0} sx={{ p: 4, borderRadius: 4, mb: 3, border: '1px solid #FF8C00', textAlign: 'center', bgcolor: '#FFFBF5' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Pool Criado! 🚀</Typography>

                    <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 3, display: 'inline-block', mb: 2, border: '1px solid #EEEEEE' }}>
                        <QRCodeSVG value={poolUrl} size={150} />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Apresente o QR Code acima ou compartilhe o link:
                    </Typography>

                    <TextField
                        fullWidth
                        size="small"
                        value={poolUrl}
                        InputProps={{
                            readOnly: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={copyToClipboard}>
                                        <Copy size={20} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ bgcolor: 'white' }}
                    />

                    <Typography variant="caption" display="block" sx={{ mt: 2, fontWeight: 700, color: '#FF8C00' }}>
                        Restante no Pool: R$ {pool.remainingAmount.toFixed(2)}
                    </Typography>
                </Card>
            )}

            <Stack spacing={2}>
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={!!pool}
                    startIcon={<CreditCard size={20} />}
                    onClick={() => handleStripeCheckout(total)}
                    sx={{
                        height: 60,
                        fontSize: '1.1rem',
                        bgcolor: '#1A1A1A',
                        borderRadius: 4,
                        '&:hover': { bgcolor: '#000000' }
                    }}
                >
                    {pool ? 'Pool Ativo' : 'Pagar Integral (Stripe)'}
                </Button>
            </Stack>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={2000}
                onClose={() => setOpenSnackbar(false)}
            >
                <Alert severity="info" sx={{ width: '100%', borderRadius: 3 }}>
                    Link copiado!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Bill;

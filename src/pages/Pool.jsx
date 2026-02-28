import React, { useState, useEffect } from 'react';
import ky from 'ky';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    Stack,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    Paper,
    CircularProgress
} from '@mui/material';
import { Users2, CreditCard, ArrowLeft } from 'lucide-react';
import { getPool, addContribution } from '../utils/orderStore';

const Pool = () => {
    const { poolId } = useParams();
    const navigate = useNavigate();
    const [pool, setPool] = useState(null);
    const [amount, setAmount] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const data = getPool(poolId);
        if (data) {
            setPool(data);
        }
        setLoading(false);
    }, [poolId]);

    const handleContribute = async () => {
        const payAmount = parseFloat(amount);
        if (!payAmount || payAmount <= 0 || payAmount > pool.remainingAmount) {
            alert("Valor inválido");
            return;
        }
        if (!name.trim()) {
            alert("Informe seu nome");
            return;
        }

        try {
            // Reusing the backend logic but customized for a pool payment
            const data = await ky.post('http://localhost:3001/create-checkout-session', {
                json: {
                    items: [
                        { name: `Contribuição Mesa - ${name}`, price: payAmount, quantity: 1 }
                    ],
                    tip: 0,
                    appTax: 0,
                    metadata: { // Send metadata if backend supports, otherwise just pass in success URL params
                        poolId: poolId,
                        contributorName: name,
                        contributedAmount: payAmount
                    },
                    customSuccessUrl: `http://localhost:3000/success?pool_id=${poolId}&amount=${payAmount}&name=${encodeURIComponent(name)}`
                }
            }).json();

            window.location.href = data.url;
        } catch (err) {
            console.error("Stripe Checkout Error:", err);
            alert(`Erro no pagamento: ${err.message}. Verifique se o servidor backend está rodando no porto 3001.`);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress color="inherit" /></Box>;

    if (!pool) {
        return (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h6">Pool não encontrada ou expirada.</Typography>
                <Button startIcon={<ArrowLeft />} onClick={() => navigate('/menu')} sx={{ mt: 2 }}>Voltar ao Menu</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                Pool de Pagamento
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                ID: {pool.id}
            </Typography>

            <Card elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #F0F0F0', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Valor Restante</Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#FF8C00' }}>
                    R$ {pool.remainingAmount.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total da Conta: R$ {pool.totalAmount.toFixed(2)}</Typography>
            </Card>

            {pool.isPaid ? (
                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: '#e8f5e9', textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 800 }}>Mesa Paga! 🎉</Typography>
                    <Typography variant="body2" sx={{ color: '#2e7d32' }}>Obrigado pela preferência.</Typography>
                </Paper>
            ) : (
                <Card elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #F0F0F0' }}>
                    <Stack spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Contribuir</Typography>
                        <TextField
                            label="Seu Nome"
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            size="small"
                        />
                        <TextField
                            label="Valor a Pagar (R$)"
                            type="number"
                            fullWidth
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            size="small"
                            placeholder={`Máx R$ ${pool.remainingAmount.toFixed(2)}`}
                        />
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<CreditCard size={20} />}
                            onClick={handleContribute}
                            sx={{
                                bgcolor: '#FF8C00',
                                height: 50,
                                fontWeight: 800,
                                '&:hover': { bgcolor: '#E67E00' }
                            }}
                        >
                            Pagar Minha Parte
                        </Button>
                    </Stack>
                </Card>
            )}

            {pool.contributions.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Users2 size={24} color="#FF8C00" /> Contribuições
                    </Typography>
                    <List dense sx={{ bgcolor: 'background.paper', borderRadius: 4, border: '1px solid #F0F0F0' }}>
                        {pool.contributions.map((c, idx) => (
                            <React.Fragment key={idx}>
                                <ListItem sx={{ py: 1.5 }}>
                                    <ListItemText
                                        primary={<Typography sx={{ fontWeight: 700 }}>{c.contributorName}</Typography>}
                                        secondary={new Date(c.timestamp).toLocaleTimeString()}
                                    />
                                    <Typography sx={{ fontWeight: 800, color: '#2e7d32' }}>+ R$ {c.amount.toFixed(2)}</Typography>
                                </ListItem>
                                {idx < pool.contributions.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            )}
        </Box>
    );
};

export default Pool;

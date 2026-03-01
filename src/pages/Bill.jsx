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
    Alert,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tooltip,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import { CreditCard, Users2, Copy, Share2, QrCode, LogOut, ChevronDown, Trash2, CheckCircle, Clock } from 'lucide-react';
import { getOrders, createPool, getPoolBySession, getAllPools, removePoolItem, startPoolCheckout } from '../utils/orderStore';
import { getTableSession, clearTableSession } from '../utils/tableStore';
import { getCurrentUser } from '../utils/userStore';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

const Bill = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [waiterTipPercent, setWaiterTipPercent] = useState(10);
    const [myPayment, setMyPayment] = useState('');
    const [pool, setPool] = useState(null);          // pool PENDENTE ativa
    const [allPools, setAllPools] = useState([]);    // histórico de todas as pools
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackMsg, setSnackMsg] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState([]); // IDs dos itens selecionados para a próxima pool/pagamento
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    // IDs dos itens que já estão em pools CAPTURADO (pagas) — excluídos da conta
    const paidItemIds = allPools
        .filter(p => p.status === 'CAPTURADO')
        .flatMap(p => p.items?.map(i => i.orderItemId) ?? []);

    useEffect(() => {
        const fetchData = async () => {
            const session = getTableSession();
            if (!session) return;

            const [allOrders, existingPool, poolHistory] = await Promise.all([
                getOrders(session.sessionId),
                getPoolBySession(session.sessionId),
                getAllPools(session.sessionId)
            ]);

            setOrders(allOrders);
            setPool(existingPool);
            setAllPools(poolHistory);

            // Sincronizar selectedItemIds com a pool ativa se ela existir
            if (existingPool) {
                setSelectedItemIds(existingPool.items?.map(i => i.orderItemId) || []);
            } else if (isFirstLoad && allOrders.length > 0) {
                // Seleção padrão: todos os itens ativos (que não foram pagos)
                const activeIds = allOrders
                    .filter(o => o.status !== 'Cancelado' && !paidItemIds.includes(o.orderItemId))
                    .map(o => o.orderItemId);
                if (activeIds.length > 0) {
                    setSelectedItemIds(activeIds);
                    setIsFirstLoad(false);
                }
            }
        };

        fetchData();

        const intervalId = setInterval(fetchData, 15000);
        return () => clearInterval(intervalId);
    }, [isFirstLoad, paidItemIds.length]);

    // Itens ativos: excluir Cancelados e já pagos
    const activeOrders = orders.filter(o =>
        o.status !== 'Cancelado' &&
        !paidItemIds.includes(o.orderItemId)
    );

    // Itens selecionados para a Pool/Pagamento atual
    const selectedOrders = activeOrders.filter(o => selectedItemIds.includes(o.orderItemId));

    const subtotal = selectedOrders.reduce((acc, item) =>
        acc + (parseFloat(item.finalPrice ?? item.price ?? 0) * (item.quantity ?? item.quantidade ?? 1)), 0);
    const waiterTip = subtotal * (waiterTipPercent / 100);
    const appTax = subtotal * 0.03; // Taxa do app fixada em 3%
    const total = subtotal + waiterTip + appTax;

    const handleToggleItemSelection = async (itemId) => {
        if (!pool) {
            // Seleção local apenas
            setSelectedItemIds(prev =>
                prev.includes(itemId)
                    ? prev.filter(id => id !== itemId)
                    : [...prev, itemId]
            );
        } else {
            // Sincronizar com pool do backend em tempo real
            try {
                if (selectedItemIds.includes(itemId)) {
                    await removePoolItem(pool.id, itemId);
                } else {
                    const session = getTableSession();
                    // Adicionamos o item à pool existente chamando createPool (o backend trata o vínculo se já houver PENDENTE)
                    await createPool(0, 0, session.sessionId, [itemId]);
                }
                // Refresh data
                const session = getTableSession();
                const [updatedPool, updatedHistory] = await Promise.all([
                    getPoolBySession(session.sessionId),
                    getAllPools(session.sessionId)
                ]);
                setPool(updatedPool);
                setAllPools(updatedHistory);
            } catch (e) {
                alert('Erro ao atualizar pool: ' + e.message);
            }
        }
    };

    const handleCreatePool = async () => {
        const payAmount = parseFloat(myPayment) || 0;
        if (payAmount >= total && total > 0) {
            alert("Para pagar o valor total, use o botão 'Pagar Integral'");
            return;
        }
        const session = getTableSession();
        if (!session) {
            alert('Não há mesa vinculada.');
            return;
        }
        try {
            // Passar os IDs dos itens SELECIONADOS para vincular à pool
            const orderItemIds = selectedItemIds.filter(Boolean);
            if (orderItemIds.length === 0) {
                alert('Selecione pelo menos um item para criar a pool.');
                return;
            }
            const newPool = await createPool(total, payAmount, session.sessionId, orderItemIds);
            setPool(newPool);
            // Atualizar histórico de pools
            const updatedHistory = await getAllPools(session.sessionId);
            setAllPools(updatedHistory);
            setSnackMsg('Pool criada/retomada com sucesso!');
            setOpenSnackbar(true);
        } catch (e) {
            alert(e.message || 'Erro ao criar Pool.');
        }
    };

    const handleRemoveItemFromPool = async (poolId, orderItemId) => {
        try {
            await removePoolItem(poolId, orderItemId);
            const session = getTableSession();
            if (session) {
                const [updatedPool, updatedHistory] = await Promise.all([
                    getPoolBySession(session.sessionId),
                    getAllPools(session.sessionId)
                ]);
                setPool(updatedPool);
                setAllPools(updatedHistory);
            }
            setSnackMsg('Item removido da pool.');
            setOpenSnackbar(true);
        } catch (e) {
            alert(e.message || 'Erro ao remover item da pool.');
        }
    };

    const handleStripeCheckout = async () => {
        const session = getTableSession();
        const user = getCurrentUser();

        if (!session) {
            alert('Não há mesa vinculada.');
            return;
        }

        if (selectedOrders.length === 0) {
            alert('Não há itens selecionados para pagar.');
            return;
        }

        try {
            // PASSO 1: Criar uma pool com os itens SELECIONADOS (Freeze)
            const orderItemIds = selectedItemIds.filter(Boolean);
            const newPool = await createPool(total, total, session.sessionId, orderItemIds);

            // PASSO 2: Iniciar checkout Stripe usando essa nova pool
            const { url } = await startPoolCheckout({
                poolId: newPool.id,
                amount: total,
                contributorName: user?.nome_completo || 'Cliente Integral',
                itemName: `Pagamento Integral Mesa ${session.tableIdentifier}`,
                userId: user?.id,
                type: 'direct' // Indica para o Success.jsx o redirecionamento
            });

            window.location.href = url;
        } catch (err) {
            console.error("Stripe Checkout Error:", err);
            alert(`Erro no pagamento: ${err.message}.`);
        }
    };

    const poolUrl = pool ? `${window.location.origin}/pool/${pool.id}` : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(poolUrl);
        setSnackMsg('Link copiado!');
        setOpenSnackbar(true);
    };

    const handleLeaveTable = () => {
        clearTableSession();
        window.location.href = '/menu';
    };

    const isFullyPaid = pool?.isPaid || false;

    // Pools abertas (PENDENTE) exibidas na seção de pools
    const openPools = allPools.filter(p => p.status === 'PENDENTE');
    // Pools fechadas (CAPTURADO)
    const closedPools = allPools.filter(p => p.status === 'CAPTURADO');

    const statusChip = (status) => {
        if (status === 'PENDENTE') return <Chip label="Aberta" size="small" icon={<Clock size={12} />} sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700, fontSize: '0.7rem' }} />;
        if (status === 'CAPTURADO') return <Chip label="Paga" size="small" icon={<CheckCircle size={12} />} sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, fontSize: '0.7rem' }} />;
        return <Chip label={status} size="small" />;
    };

    if (activeOrders.length === 0 && allPools.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h6" color="text.secondary">Sua conta está vazia.</Typography>
                <Typography variant="body2" color="text.secondary">Peça itens pelo Menu para começar.</Typography>
                <Button sx={{ mt: 3 }} onClick={handleLeaveTable} variant="outlined" color="primary">
                    Sair da Mesa
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
                Minha Conta
            </Typography>

            {/* ─── ITENS DA CONTA ─── */}
            {activeOrders.length > 0 ? (
                <Card elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #F0F0F0' }}>
                    <List disablePadding>
                        {activeOrders.map((item, index) => (
                            <React.Fragment key={item.orderItemId ?? index}>
                                <ListItem sx={{ px: 0, py: 1.5, alignItems: 'center' }}>
                                    <Checkbox
                                        checked={selectedItemIds.includes(item.orderItemId)}
                                        onChange={() => handleToggleItemSelection(item.orderItemId)}
                                        sx={{ color: '#FF8C00', '&.Mui-checked': { color: '#FF8C00' }, mr: 1 }}
                                    />
                                    <ListItemText
                                        primary={<Typography component="span" sx={{ fontWeight: 700 }}>{item.quantity ?? item.quantidade ?? 1}x {item.name}</Typography>}
                                        secondaryTypographyProps={{ component: 'div' }}
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
                                                <Chip label={item.status} size="small" sx={{ mt: 0.5, fontSize: '0.65rem', height: 18 }} />
                                            </Box>
                                        }
                                    />
                                    <Typography sx={{ fontWeight: 800, ml: 2 }}>
                                        R$ {(parseFloat(item.finalPrice ?? item.price ?? 0) * (item.quantity ?? item.quantidade ?? 1)).toFixed(2)}
                                    </Typography>
                                </ListItem>
                                {index < activeOrders.length - 1 && <Divider sx={{ borderStyle: 'dashed' }} />}
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

                            <Box sx={{ px: 1, mt: 1 }}>
                                <TextField
                                    label="Gorjeta Garçom (%)"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={waiterTipPercent}
                                    onChange={(e) => {
                                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                                        setWaiterTipPercent(val);
                                    }}
                                    disabled={!!pool} // Não mudar após criação/pagamento do pool
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                    helperText={!!pool ? "Gorjeta fixada após criação do pool" : ""}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Taxa do App (3%)</Typography>
                                <Typography sx={{ fontWeight: 600 }}>R$ {appTax.toFixed(2)}</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '2px solid #F0F0F0' }}>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>Total Geral</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: '#FF8C00' }}>R$ {total.toFixed(2)}</Typography>
                            </Box>
                        </Stack>
                    </List>
                </Card>
            ) : (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #E8F5E9', bgcolor: '#F9FFF9', textAlign: 'center' }}>
                    <CheckCircle size={32} color="#2e7d32" />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#2e7d32', mt: 1 }}>
                        Todos os itens foram pagos!
                    </Typography>
                </Paper>
            )}

            {/* ─── POOL ATIVA (PENDENTE) ─── */}
            {activeOrders.length > 0 && (
                !pool ? (
                    <Card elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #F0F0F0', bgcolor: '#F9F9F9' }}>
                        <Stack spacing={2}>
                            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Users2 size={24} color="#FF8C00" /> Dividir Conta (Pool)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Quanto você deseja pagar agora? O restante será dividido via QR Code para outros comensais.
                            </Typography>

                            <TextField
                                fullWidth label="Seu Valor (R$)" type="number" size="small"
                                value={myPayment}
                                onChange={(e) => {
                                    let val = parseFloat(e.target.value);
                                    if (val > total) val = total;
                                    setMyPayment(isNaN(val) ? '' : val.toString());
                                }}
                                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                            />

                            <Button
                                variant="outlined" fullWidth size="large" startIcon={<Share2 size={20} />}
                                onClick={handleCreatePool}
                                sx={{ borderRadius: 3, borderColor: '#FF8C00', color: '#FF8C00', fontWeight: 700, '&:hover': { borderColor: '#E67E00', bgcolor: '#FFF5E6' } }}
                            >
                                Criar Pool de Pagamento
                            </Button>
                        </Stack>
                    </Card>
                ) : (
                    <Card elevation={0} sx={{ p: 4, borderRadius: 4, mb: 3, border: '1px solid #FF8C00', textAlign: 'center', bgcolor: '#FFFBF5' }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Pool Ativa 🚀</Typography>

                        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 3, display: 'inline-block', mb: 2, border: '1px solid #EEE' }}>
                            <QRCodeSVG value={poolUrl} size={150} />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Compartilhe o link ou QR Code para dividir:
                        </Typography>

                        <TextField
                            fullWidth size="small" value={poolUrl}
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={copyToClipboard}><Copy size={20} /></IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ bgcolor: 'white' }}
                        />

                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, pt: 2, borderTop: '1px solid #FFE0B2' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#FF8C00' }}>
                                Total: R$ {pool.totalAmount?.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#E65100' }}>
                                Restante: R$ {pool.remainingAmount?.toFixed(2)}
                            </Typography>
                        </Stack>

                        {/* Itens vinculados à pool ativa com botão de remoção */}
                        {pool.items && pool.items.length > 0 && (
                            <Box sx={{ mt: 2, textAlign: 'left' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#666', display: 'block', mb: 1 }}>
                                    ITENS NA POOL:
                                </Typography>
                                {pool.items.map((item) => (
                                    <Box key={item.orderItemId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                                        <Typography variant="caption">{item.quantity}x {item.name}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>R$ {parseFloat(item.finalPrice).toFixed(2)}</Typography>
                                            <Tooltip title="Remover da pool">
                                                <IconButton size="small" onClick={() => handleRemoveItemFromPool(pool.id, item.orderItemId)}
                                                    sx={{ color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }}>
                                                    <Trash2 size={14} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Card>
                )
            )}

            {/* ─── AÇÕES DE PAGAMENTO ─── */}
            {activeOrders.length > 0 && !isFullyPaid && (
                <Stack spacing={2} sx={{ mb: 3 }}>
                    <Button
                        variant="contained" fullWidth size="large"
                        disabled={!!pool}
                        startIcon={<CreditCard size={20} />}
                        onClick={handleStripeCheckout}
                        sx={{ height: 60, fontSize: '1.1rem', bgcolor: '#1A1A1A', borderRadius: 4, '&:hover': { bgcolor: '#000' } }}
                    >
                        {pool ? 'Pool Ativo — Aguardando Contribuições' : 'Pagar Integral (Stripe)'}
                    </Button>
                </Stack>
            )}

            {isFullyPaid && (
                <Stack spacing={2} sx={{ mb: 3 }}>
                    <Button
                        variant="contained" fullWidth size="large"
                        startIcon={<LogOut size={20} />}
                        onClick={handleLeaveTable}
                        sx={{ height: 60, fontSize: '1.1rem', bgcolor: '#4caf50', borderRadius: 4, fontWeight: 800, '&:hover': { bgcolor: '#388e3c' } }}
                    >
                        Conta Paga — Sair da Mesa
                    </Button>
                </Stack>
            )}

            {/* ─── HISTÓRICO DE TODAS AS POOLS DA MESA ─── */}
            {allPools.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Users2 size={20} color="#FF8C00" /> Pools da Mesa
                    </Typography>
                    <Stack spacing={1.5}>
                        {allPools.map((p) => (
                            <Accordion key={p.id} elevation={0} disableGutters
                                sx={{ border: '1px solid #F0F0F0', borderRadius: '12px !important', '&:before': { display: 'none' }, overflow: 'hidden' }}>
                                <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 1 }}>
                                        {statusChip(p.status)}
                                        <Typography variant="body2" sx={{ fontWeight: 700, flexGrow: 1 }}>
                                            Pool #{p.id}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: p.status === 'CAPTURADO' ? '#2e7d32' : '#FF8C00' }}>
                                            R$ {p.totalAmount?.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ bgcolor: '#FAFAFA', pt: 0 }}>
                                    {p.items && p.items.length > 0 && (
                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#888', display: 'block', mb: 0.5 }}>ITENS:</Typography>
                                            {p.items.map((item) => (
                                                <Box key={item.orderItemId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption">{item.quantity}x {item.name}</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>R$ {parseFloat(item.finalPrice).toFixed(2)}</Typography>
                                                </Box>
                                            ))}
                                            <Divider sx={{ my: 1 }} />
                                        </Box>
                                    )}
                                    {p.contributions && p.contributions.length > 0 ? (
                                        p.contributions.map((c, i) => (
                                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700 }}>{c.contributorName}</Typography>
                                                <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 800 }}>+ R$ {c.amount?.toFixed(2)}</Typography>
                                            </Box>
                                        ))
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">Nenhuma contribuição ainda.</Typography>
                                    )}
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="text.secondary">Pago: R$ {p.paid?.toFixed(2)}</Typography>
                                        <Typography variant="caption" color="text.secondary">Restante: R$ {p.remainingAmount?.toFixed(2)}</Typography>
                                    </Box>
                                    {p.status === 'PENDENTE' && (
                                        <Button
                                            size="small" variant="outlined" fullWidth
                                            onClick={() => navigate(`/pool/${p.id}`)}
                                            sx={{ mt: 1.5, borderRadius: 2, borderColor: '#FF8C00', color: '#FF8C00', fontSize: '0.75rem' }}
                                        >
                                            Ver/Pagar Pool →
                                        </Button>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* ─── BOTÃO SAIR DA MESA ─── */}
            <Button
                variant="text" fullWidth size="small"
                onClick={handleLeaveTable} startIcon={<LogOut size={16} />}
                sx={{ mt: 4, color: '#999', fontWeight: 700 }}
            >
                Sair da Mesa
            </Button>

            <Snackbar open={openSnackbar} autoHideDuration={2500} onClose={() => setOpenSnackbar(false)}>
                <Alert severity="success" sx={{ width: '100%', borderRadius: 3 }}>{snackMsg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default Bill;

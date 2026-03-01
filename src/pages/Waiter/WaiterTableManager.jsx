import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
//import { Box, Typography, Button, Card, Stack, Divider, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItemButton, ListItemText, ListItemAvatar, Avatar, TextField, Grid } from '@mui/material';
//import { Box, Typography, Button, Card, Stack, Divider, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItemButton, ListItemText, ListItemAvatar, Avatar, TextField } from '@mui/material';
import { Box, Typography, Button, Card, Stack, Divider, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemButton, ListItemText, ListItemAvatar, Avatar, TextField, Grid } from '@mui/material';
import { Camera, ArrowLeft, ShoppingBag, X, Search } from 'lucide-react';
import Tesseract from 'tesseract.js';
import ky from 'ky';

const WaiterTableManager = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const [tableDetails, setTableDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    // OCR State
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrResult, setOcrResult] = useState('');
    const fileInputRef = useRef(null);

    // --- NOVO: Estados para o Lançamento de Pedidos ---
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [observations, setObservations] = useState('');
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [waiterTipPercent, setWaiterTipPercent] = useState(10);

    // Função para buscar os dados da mesa (separada para podermos recarregar depois de um pedido)
    const fetchTableDetails = async () => {
        try {
            const data = await ky.get(`http://localhost:4242/api/waiter/tables/${tableId}`).json();
            setTableDetails(data);
        } catch (err) {
            console.error("Error fetching table details:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTableDetails();
    }, [tableId]);

    // --- NOVO: Funções do Menu ---
    const handleOpenMenu = async () => {
        setMenuOpen(true);
        if (menuItems.length === 0) {
            try {
                const data = await ky.get('http://localhost:4242/api/menu').json();
                setMenuItems(data);
            } catch (err) {
                console.error('Erro ao buscar cardápio', err);
                alert('Falha ao carregar o cardápio.');
            }
        }
    };

    const handleSelectMenuItem = (item) => {
        setSelectedItem(item);
        setObservations(''); // Limpa as observações antigas
    };

    const handleConfirmOrder = async () => {
        if (!selectedItem || !tableDetails?.sessao_id) return;

        setSubmittingOrder(true);
        try {
            await ky.post('http://localhost:4242/api/orders', {
                json: {
                    item: selectedItem,
                    selectedAddons: [], // Para manter simples no terminal do garçom por enquanto
                    observations: observations,
                    sessionId: tableDetails.sessao_id
                }
            }).json();

            // Sucesso! Limpa o estado e recarrega a mesa
            setSelectedItem(null);
            setMenuOpen(false);
            await fetchTableDetails();

        } catch (err) {
            console.error(err);
            alert('Erro ao lançar pedido. Verifique se a mesa está aberta.');
        } finally {
            setSubmittingOrder(false);
        }
    };

    // --- Funções Originais ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setOcrLoading(true);
        setOcrResult('');

        try {
            const result = await Tesseract.recognize(file, 'eng');
            const text = result.data.text;
            const cardRegex = /(?:\d[ -]*?){13,16}/g;
            const matches = text.match(cardRegex);

            if (matches && matches.length > 0) {
                const cleanestMatch = matches[0].replace(/[ -]/g, '');
                setOcrResult(cleanestMatch);
                alert(`Cartão Lido: **** **** **** ${cleanestMatch.slice(-4)}`);
            } else {
                alert('Não foi possível ler os números do cartão. Tente novamente com mais luz.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao processar imagem.');
        } finally {
            setOcrLoading(false);
        }
    };

    const handleCloseTableSession = async () => {
        if (!window.confirm('Tem certeza que deseja fechar esta mesa? Os clientes não poderão mais fazer pedidos.')) return;

        try {
            await ky.post(`http://localhost:4242/api/waiter/tables/${tableId}/close`).json();
            alert('Mesa fechada com sucesso!');
            navigate('/waiter');
        } catch (e) {
            alert('Erro ao fechar mesa.');
        }
    };

    if (loading) return <Box sx={{ display: 'flex', mt: 10, justifyContent: 'center' }}><CircularProgress /></Box>;
    if (!tableDetails) return <Typography>Mesa não encontrada</Typography>;

    const isActive = tableDetails.status === 'ABERTA';

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <IconButton onClick={() => navigate('/waiter')} sx={{ mr: 2 }}><ArrowLeft /></IconButton>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>Mesa {tableDetails.identificador}</Typography>
            </Box>

            <Grid container spacing={4}>
                {/* General Info / Actions */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #E5E7EB' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Ações Rápidas</Typography>

                        <Stack spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<ShoppingBag />}
                                fullWidth
                                disabled={!isActive}
                                onClick={handleOpenMenu}
                                sx={{ height: 50, fontWeight: 700, borderColor: '#FF8C00', color: '#FF8C00', '&:hover': { borderColor: '#E67E00', bgcolor: '#FFF5E6' } }}
                            >
                                Lançar Novo Pedido
                            </Button>

                            {isActive ? (
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<X />}
                                    fullWidth
                                    onClick={handleCloseTableSession}
                                    sx={{ height: 50, fontWeight: 700 }}
                                >
                                    Fechar Conta/Sessão da Mesa
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    sx={{ bgcolor: '#FF8C00', '&:hover': { bgcolor: '#E67E00' }, height: 50, fontWeight: 700 }}
                                    fullWidth
                                    onClick={() => alert('Rota para forçar abertura ainda será implementada')}
                                >
                                    Abrir Nova Sessão
                                </Button>
                            )}
                        </Stack>
                    </Card>

                    {/* OCR Scanner */}
                    <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E5E7EB', bgcolor: '#FFF5E6' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#FF8C00' }}>Câmera (OCR Pagamento)</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Escaneie a frente do cartão do cliente para preencher a cobrança automaticamente.
                        </Typography>

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />

                        <Button
                            variant="contained"
                            startIcon={ocrLoading ? <CircularProgress size={20} color="inherit" /> : <Camera />}
                            fullWidth
                            disabled={ocrLoading || !isActive}
                            sx={{ bgcolor: '#FF8C00', '&:hover': { bgcolor: '#E67E00' }, height: 50, fontWeight: 700 }}
                            onClick={() => fileInputRef.current.click()}
                        >
                            {ocrLoading ? 'Analisando Imagem...' : 'Escanear Cartão'}
                        </Button>

                        {ocrResult && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #FFE0B2' }}>
                                <Typography variant="caption" color="text.secondary">Número Detectado:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 800, letterSpacing: 2 }}>
                                    **** **** **** {ocrResult.slice(-4)}
                                </Typography>
                            </Box>
                        )}
                    </Card>
                </Grid>

                {/* Account Summary */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E5E7EB' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Extrato de Pagamento</Typography>

                        {tableDetails.pedidos && tableDetails.pedidos.length > 0 ? (
                            <List disablePadding>
                                {tableDetails.pedidos.map((p, idx) => (
                                    <React.Fragment key={idx}>
                                        <ListItem sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={<Typography sx={{ fontWeight: 700 }}>{p.quantidade}x {p.nome_item}</Typography>}
                                                secondary={p.status}
                                            />
                                            <Typography sx={{ fontWeight: 800 }}>R$ {parseFloat(p.valor_total).toFixed(2)}</Typography>
                                        </ListItem>
                                        {idx < tableDetails.pedidos.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}

                                <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="text.secondary">Subtotal Itens</Typography>
                                        <Typography sx={{ fontWeight: 600 }}>R$ {parseFloat(tableDetails.total_itens || 0).toFixed(2)}</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                        <Typography color="text.secondary">Gorjeta Sugerida</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TextField
                                                type="number"
                                                size="small"
                                                variant="standard"
                                                value={waiterTipPercent}
                                                onChange={(e) => setWaiterTipPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                                                disabled={!!tableDetails.pool}
                                                sx={{ width: 60, '& input': { textAlign: 'right', fontWeight: 700 } }}
                                                InputProps={{ endAdornment: <Typography variant="caption">%</Typography> }}
                                            />
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="text.secondary">Taxa do App (3%)</Typography>
                                        <Typography sx={{ fontWeight: 600 }}>R$ {(parseFloat(tableDetails.total_itens || 0) * 0.03).toFixed(2)}</Typography>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Total Final</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#FF8C00' }}>
                                            R$ {(
                                                tableDetails.pool ? tableDetails.pool.total :
                                                    (parseFloat(tableDetails.total_itens || 0) * (1 + (waiterTipPercent / 100) + 0.03))
                                            ).toFixed(2)}
                                        </Typography>
                                    </Box>

                                    {tableDetails.pool && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
                                            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800, display: 'block', mb: 1 }}>STATUS DO PAGAMENTO (POOL)</Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2">Já Pago:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534' }}>R$ {tableDetails.pool.pago.toFixed(2)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Restante:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#991B1B' }}>R$ {tableDetails.pool.restante.toFixed(2)}</Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Stack>
                            </List>
                        ) : (
                            <Typography color="text.secondary">Nenhum pedido nesta sessão ainda.</Typography>
                        )}
                    </Card>
                </Grid>
            </Grid>

            {/* --- MODAL DE LANÇAMENTO DE PEDIDO --- */}
            <Dialog
                open={menuOpen}
                onClose={() => { setMenuOpen(false); setSelectedItem(null); }}
                fullWidth
                maxWidth="sm"
            >
                {!selectedItem ? (
                    <>
                        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Cardápio</DialogTitle>
                        <DialogContent dividers sx={{ p: 0 }}>
                            <List disablePadding>
                                {menuItems.map((item) => (
                                    <ListItemButton key={item.id} onClick={() => handleSelectMenuItem(item)} sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
                                        <ListItemAvatar>
                                            <Avatar src={item.image} variant="rounded" sx={{ width: 56, height: 56, mr: 2 }} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>}
                                            secondary={<Typography variant="body2" color="text.secondary" noWrap>{item.description}</Typography>}
                                        />
                                        <Typography sx={{ fontWeight: 800, color: '#FF8C00' }}>R$ {item.price.toFixed(2)}</Typography>
                                    </ListItemButton>
                                ))}
                                {menuItems.length === 0 && (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                )}
                            </List>
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setMenuOpen(false)} sx={{ color: '#757575' }}>Cancelar</Button>
                        </DialogActions>
                    </>
                ) : (
                    <>
                        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={() => setSelectedItem(null)}><ArrowLeft size={20} /></IconButton>
                            Detalhes do Pedido
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Avatar src={selectedItem.image} variant="rounded" sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedItem.name}</Typography>
                                <Typography variant="h6" sx={{ color: '#FF8C00', fontWeight: 900 }}>R$ {selectedItem.price.toFixed(2)}</Typography>
                            </Box>

                            <TextField
                                label="Observações (Opcional)"
                                placeholder="Ex: Sem cebola, ponto da carne..."
                                fullWidth
                                multiline
                                rows={3}
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                        </DialogContent>
                        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                            <Button onClick={() => setSelectedItem(null)} sx={{ color: '#757575' }}>Voltar</Button>
                            <Button
                                variant="contained"
                                disabled={submittingOrder}
                                onClick={handleConfirmOrder}
                                sx={{ bgcolor: '#FF8C00', '&:hover': { bgcolor: '#E67E00' }, fontWeight: 700, px: 4 }}
                            >
                                {submittingOrder ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Pedido'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default WaiterTableManager;
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, Stack, Divider, CircularProgress, IconButton } from '@mui/material';
import { Camera, ArrowLeft, CreditCard, ShoppingBag, X } from 'lucide-react';
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

    useEffect(() => {
        const fetchTableDetails = async () => {
            try {
                // Future endpoint to fetch detailed table data including active session & orders
                const data = await ky.get(`http://localhost:4242/api/waiter/tables/${tableId}`).json();
                setTableDetails(data);
            } catch (err) {
                console.error("Error fetching table details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTableDetails();
    }, [tableId]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setOcrLoading(true);
        setOcrResult('');

        try {
            const result = await Tesseract.recognize(
                file,
                'eng',
                { logger: m => console.log(m) }
            );

            // Tentar extrair 16 digitos seguidos ou agrupados de 4 em 4 via Regex simples
            const text = result.data.text;
            const cardRegex = /(?:\d[ -]*?){13,16}/g;
            const matches = text.match(cardRegex);

            if (matches && matches.length > 0) {
                const cleanestMatch = matches[0].replace(/[ -]/g, '');
                setOcrResult(cleanestMatch);
                alert(`Cartão Lido: **** **** **** ${cleanestMatch.slice(-4)}\n(Apenas demonstração, não transaciona real via Tesseract no modo DEMO)`);
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
                <Grid item xs={12} md={5}>
                    <Card elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3, border: '1px solid #E5E7EB' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Ações Rápidas</Typography>

                        <Stack spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<ShoppingBag />}
                                fullWidth
                                disabled={!isActive}
                                onClick={() => alert('O garçom abriria o Menu aqui p/ a mesa ' + tableId)}
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
                                >
                                    Fechar Conta/Sessão da Mesa
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    sx={{ bgcolor: '#FF8C00', '&:hover': { bgcolor: '#E67E00' } }}
                                    fullWidth
                                    onClick={() => alert('Rota para forçar abertura (via cliente ou garçom)')}
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
                <Grid item xs={12} md={7}>
                    <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E5E7EB' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Extrato Atual</Typography>

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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Total Pendente</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#FF8C00' }}>
                                        R$ {parseFloat(tableDetails.total_pendente || 0).toFixed(2)}
                                    </Typography>
                                </Box>
                            </List>
                        ) : (
                            <Typography color="text.secondary">Nenhum pedido nesta sessão ainda.</Typography>
                        )}
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default WaiterTableManager;

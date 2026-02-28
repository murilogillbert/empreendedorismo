import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Button,
    IconButton,
    Stack,
    Checkbox,
    FormControlLabel,
    TextField,
    Divider,
    Paper
} from '@mui/material';
import { X, Plus, Minus, Info } from 'lucide-react';

const ItemDetailsModal = ({ open, onClose, item, onAdd }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [observations, setObservations] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        if (item) {
            const addonsTotal = selectedAddons.reduce((acc, curr) => acc + curr.price, 0);
            setTotalPrice((item.price + addonsTotal) * quantity);
        }
    }, [item, selectedAddons, quantity]);

    if (!item) return null;

    const handleToggleAddon = (addon) => {
        setSelectedAddons(prev =>
            prev.find(a => a.name === addon.name)
                ? prev.filter(a => a.name !== addon.name)
                : [...prev, addon]
        );
    };

    const handleConfirm = () => {
        onAdd(item, selectedAddons, observations, quantity);
        setQuantity(1);
        setSelectedAddons([]);
        setObservations('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" sx={{ '& .MuiDialog-paper': { borderRadius: 6 } }}>
            <Box sx={{ position: 'relative' }}>
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(255,255,255,0.8)', zIndex: 1 }}
                >
                    <X size={20} />
                </IconButton>
                <Box
                    component="img"
                    src={item.image}
                    sx={{ width: '100%', height: 200, objectFit: 'cover' }}
                />
            </Box>

            <DialogContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>{item.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{item.description}</Typography>

                {item.ingredients && item.ingredients.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Info size={16} color="#757575" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A1A1A' }}>
                                Ingredientes
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            {item.ingredients.join(', ')}
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {item.addons && item.addons.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                            Adicionais (Opcional)
                        </Typography>
                        <Stack spacing={1}>
                            {item.addons.map((addon, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 1.5,
                                        borderRadius: 3,
                                        border: '1px solid #F0F0F0',
                                        bgcolor: selectedAddons.find(a => a.name === addon.name) ? '#FFF8F0' : 'transparent',
                                        borderColor: selectedAddons.find(a => a.name === addon.name) ? '#FF8C00' : '#F0F0F0'
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={!!selectedAddons.find(a => a.name === addon.name)}
                                                onChange={() => handleToggleAddon(addon)}
                                                sx={{ color: '#FF8C00', '&.Mui-checked': { color: '#FF8C00' } }}
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{addon.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">+ R$ {addon.price.toFixed(2)}</Typography>
                                            </Box>
                                        }
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Observações
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Ex: Sem cebola, ponto da carne mal passado..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#FAFAFA' }
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, flexDirection: 'column', gap: 2 }}>
                <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%', justifyContent: 'center' }}>
                    <IconButton
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        sx={{ border: '1px solid #DDD' }}
                    >
                        <Minus size={20} />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>{quantity}</Typography>
                    <IconButton
                        onClick={() => setQuantity(quantity + 1)}
                        sx={{ border: '1px solid #DDD' }}
                    >
                        <Plus size={20} />
                    </IconButton>
                </Stack>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleConfirm}
                    sx={{
                        bgcolor: '#1A1A1A',
                        color: 'white',
                        py: 1.5,
                        borderRadius: 4,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        '&:hover': { bgcolor: '#000' },
                        display: 'flex',
                        justifyContent: 'space-between',
                        px: 3
                    }}
                >
                    <span>Adicionar</span>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ItemDetailsModal;

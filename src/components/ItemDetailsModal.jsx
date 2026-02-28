import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Button,
    IconButton,
    Stack,
    Checkbox,
    TextField,
    Divider,
    Chip
} from '@mui/material';
import { X, Plus, Minus, Info, ShoppingBag } from 'lucide-react';

const ItemDetailsModal = ({ open, onClose, item, onAdd }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [observations, setObservations] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        if (item) {
            const base = parseFloat(item.price ?? 0);
            const addonsTotal = selectedAddons.reduce((acc, curr) => acc + parseFloat(curr.price ?? 0), 0);
            setTotalPrice((base + addonsTotal) * quantity);
        }
    }, [item, selectedAddons, quantity]);

    // Reset state when modal opens with a new item
    useEffect(() => {
        if (open) {
            setQuantity(1);
            setSelectedAddons([]);
            setObservations('');
        }
    }, [open, item]);

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
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: 2,
                    overflow: 'hidden',
                    m: 2,
                }
            }}
        >
            {/* Hero image with overlaid close button */}
            <Box sx={{ position: 'relative' }}>
                <Box
                    component="img"
                    src={item.image}
                    alt={item.name}
                    sx={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                />

                {/* Gradient overlay at bottom of image */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: 80,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
                }} />

                {/* Price badge on image */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 14, left: 16,
                    bgcolor: '#FF8C00',
                    borderRadius: 2.5,
                    px: 1.5, py: 0.4,
                }}>
                    <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: '1rem' }}>
                        R$ {parseFloat(item.price ?? 0).toFixed(2)}
                    </Typography>
                </Box>

                {/* ✕ Close button — top-right corner, always visible */}
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        width: 34,
                        height: 34,
                        '&:hover': { bgcolor: '#fff', transform: 'scale(1.08)' },
                        transition: 'all 0.15s ease',
                    }}
                >
                    <X size={18} strokeWidth={2.5} />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3, pb: 1 }}>
                {/* Title & description */}
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5, color: '#1A1A1A' }}>
                    {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
                    {item.description}
                </Typography>

                {/* Ingredients */}
                {item.ingredients && item.ingredients.length > 0 && (
                    <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#FAFAFA', borderRadius: 3, border: '1px solid #F0F0F0' }}>
                        <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.6 }}>
                            <Info size={14} color="#999" />
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Ingredientes
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {item.ingredients.join(' · ')}
                        </Typography>
                    </Box>
                )}

                {/* Add-ons */}
                {item.addons && item.addons.length > 0 && (
                    <>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#1A1A1A' }}>
                            Adicionais
                            <Chip label="Opcional" size="small" sx={{ ml: 1, fontSize: '0.65rem', height: 18, bgcolor: '#F0F0F0', color: '#888', '& .MuiChip-label': { px: 1 } }} />
                        </Typography>
                        <Stack spacing={1}>
                            {item.addons.map((addon, index) => {
                                const isChecked = !!selectedAddons.find(a => a.name === addon.name);
                                return (
                                    <Box
                                        key={index}
                                        onClick={() => handleToggleAddon(addon)}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 1.5,
                                            borderRadius: 3,
                                            border: '1.5px solid',
                                            borderColor: isChecked ? '#FF8C00' : '#F0F0F0',
                                            bgcolor: isChecked ? '#FFF8F0' : '#FAFAFA',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                            '&:hover': { borderColor: '#FFB74D', bgcolor: '#FFFAF5' }
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A1A1A', lineHeight: 1.3 }}>
                                                {addon.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#FF8C00', fontWeight: 700 }}>
                                                + R$ {parseFloat(addon.price ?? 0).toFixed(2)}
                                            </Typography>
                                        </Box>
                                        <Checkbox
                                            checked={isChecked}
                                            onChange={() => handleToggleAddon(addon)}
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{
                                                p: 0.5,
                                                color: '#DDD',
                                                '&.Mui-checked': { color: '#FF8C00' }
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </>
                )}

                {/* Observations */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#1A1A1A' }}>
                    Observações
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Ex: Sem cebola, ponto mal passado..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: '#FAFAFA',
                            fontSize: '0.875rem',
                            '& fieldset': { borderColor: '#EBEBEB' },
                            '&:hover fieldset': { borderColor: '#CCC' },
                            '&.Mui-focused fieldset': { borderColor: '#FF8C00' },
                        }
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 2, flexDirection: 'column', gap: 1.5 }}>
                {/* Quantity selector */}
                <Stack direction="row" alignItems="center" spacing={0} sx={{
                    width: '100%',
                    justifyContent: 'center',
                    bgcolor: '#F5F5F5',
                    borderRadius: 3,
                    p: 0.5,
                }}>
                    <IconButton
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        size="small"
                        sx={{
                            bgcolor: quantity > 1 ? '#FF8C00' : '#E0E0E0',
                            color: quantity > 1 ? '#fff' : '#AAA',
                            width: 34, height: 34,
                            borderRadius: 2,
                            '&:hover': { bgcolor: quantity > 1 ? '#E67E00' : '#E0E0E0' },
                            transition: 'all 0.15s',
                        }}
                    >
                        <Minus size={16} strokeWidth={2.5} />
                    </IconButton>

                    <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', minWidth: 48, textAlign: 'center' }}>
                        {quantity}
                    </Typography>

                    <IconButton
                        onClick={() => setQuantity(quantity + 1)}
                        size="small"
                        sx={{
                            bgcolor: '#FF8C00',
                            color: '#fff',
                            width: 34, height: 34,
                            borderRadius: 2,
                            '&:hover': { bgcolor: '#E67E00' },
                        }}
                    >
                        <Plus size={16} strokeWidth={2.5} />
                    </IconButton>
                </Stack>

                {/* Add to order button */}
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleConfirm}
                    startIcon={<ShoppingBag size={18} />}
                    sx={{
                        bgcolor: '#1A1A1A',
                        color: 'white',
                        py: 1.6,
                        borderRadius: 3.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 800,
                        letterSpacing: 0.2,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                        '&:hover': {
                            bgcolor: '#000',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                        },
                        display: 'flex',
                        justifyContent: 'space-between',
                        px: 3,
                    }}
                >
                    <span>Adicionar ao Pedido</span>
                    <span style={{ opacity: 0.9 }}>R$ {totalPrice.toFixed(2)}</span>
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ItemDetailsModal;

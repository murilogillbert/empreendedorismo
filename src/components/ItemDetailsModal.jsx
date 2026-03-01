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
            TransitionProps={{ timeout: 400 }}
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: '32px',
                    overflow: 'hidden',
                    m: { xs: 1, sm: 2 },
                    maxHeight: '92vh'
                }
            }}
        >
            {/* Hero image with overlaid close button */}
            <Box sx={{ position: 'relative' }}>
                <Box
                    component="img"
                    src={item.image}
                    alt={item.name}
                    sx={{ width: '100%', height: { xs: 200, sm: 240 }, objectFit: 'cover', display: 'block' }}
                />

                {/* Gradient overlay at bottom of image */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: 100,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                }} />

                {/* Price badge on image - Premium Look */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 20, left: 20,
                    bgcolor: 'var(--primary)',
                    borderRadius: '14px',
                    px: 2, py: 0.8,
                    boxShadow: '0 8px 20px rgba(255,140,0,0.4)'
                }}>
                    <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: '1.2rem' }}>
                        R$ {parseFloat(item.price ?? 0).toFixed(2)}
                    </Typography>
                </Box>

                {/* ✕ Close button — modern blur style */}
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        width: 40,
                        height: 40,
                        color: 'var(--text-main)',
                        '&:hover': { bgcolor: '#fff', transform: 'scale(1.1) rotate(90deg)' },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <X size={22} strokeWidth={3} />
                </IconButton>
            </Box>

            <DialogContent className="no-scrollbar" sx={{ p: { xs: 3, sm: 4 }, pb: 2 }}>
                {/* Title & description */}
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: 'var(--text-main)', fontSize: '1.5rem', letterSpacing: -0.5 }}>
                    {item.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 3, lineHeight: 1.6, fontSize: '0.95rem' }}>
                    {item.description}
                </Typography>

                {/* Ingredients */}
                {item.ingredients && item.ingredients.length > 0 && (
                    <Box sx={{ mb: 3.5, p: 2, bgcolor: '#F8F9FA', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Info size={16} color="var(--primary)" />
                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: 1 }}>
                                Ingredientes
                            </Typography>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {item.ingredients.map((ing, k) => (
                                <Typography key={k} variant="body2" sx={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {ing}{k < item.ingredients.length - 1 ? ' •' : ''}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* Add-ons */}
                {item.addons && item.addons.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 1 }}>
                            Adicionais
                            <Box sx={{ fontSize: '0.7rem', bgcolor: '#F0F0F0', color: '#888', px: 1, py: 0.3, borderRadius: '6px', fontWeight: 800 }}>OPCIONAL</Box>
                        </Typography>
                        <Stack spacing={1.5}>
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
                                            p: 2,
                                            borderRadius: '20px',
                                            border: '2px solid',
                                            borderColor: isChecked ? 'var(--primary)' : 'var(--border-color)',
                                            bgcolor: isChecked ? '#FFF9F2' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { borderColor: isChecked ? 'var(--primary)' : '#CCC' }
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                                {addon.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'var(--primary)', fontWeight: 800 }}>
                                                + R$ {parseFloat(addon.price ?? 0).toFixed(2)}
                                            </Typography>
                                        </Box>
                                        <Checkbox
                                            checked={isChecked}
                                            icon={<Box sx={{ width: 24, height: 24, borderRadius: '8px', border: '2px solid var(--border-color)' }} />}
                                            checkedIcon={
                                                <Box sx={{
                                                    width: 24, height: 24, borderRadius: '8px',
                                                    bgcolor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Plus size={16} color="#fff" strokeWidth={4} />
                                                </Box>
                                            }
                                            sx={{ p: 0 }}
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                {/* Observations */}
                <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5, color: 'var(--text-main)' }}>
                    Observações
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Algum pedido especial? (Ex: Sem cebola...)"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '18px',
                            bgcolor: '#F8F9FA',
                            fontSize: '0.9rem',
                            '& fieldset': { borderColor: 'var(--border-color)' },
                            '&:hover fieldset': { borderColor: '#CCC' },
                            '&.Mui-focused fieldset': { borderColor: 'var(--primary)', borderWidth: 2 },
                        }
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ p: { xs: 3, sm: 4 }, pt: 1, flexDirection: 'column', gap: 2 }}>
                {/* Quantity selector - Modern floating style */}
                <Stack direction="row" alignItems="center" spacing={3} sx={{
                    bgcolor: '#F0F0F0',
                    borderRadius: '20px',
                    p: 0.8,
                    width: 'fit-content'
                }}>
                    <IconButton
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        sx={{
                            bgcolor: quantity > 1 ? '#fff' : 'transparent',
                            color: 'var(--text-main)',
                            width: 40, height: 40,
                            borderRadius: '16px',
                            boxShadow: quantity > 1 ? '0 4px 8px rgba(0,0,0,0.05)' : 'none',
                            '&:hover': { bgcolor: '#fff' },
                        }}
                    >
                        <Minus size={20} strokeWidth={3} />
                    </IconButton>

                    <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', minWidth: 20 }}>
                        {quantity}
                    </Typography>

                    <IconButton
                        onClick={() => setQuantity(quantity + 1)}
                        sx={{
                            bgcolor: '#fff',
                            color: 'var(--text-main)',
                            width: 40, height: 40,
                            borderRadius: '16px',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                            '&:hover': { bgcolor: '#fff' },
                        }}
                    >
                        <Plus size={20} strokeWidth={3} />
                    </IconButton>
                </Stack>

                {/* Add to order button - Premium Full Width */}
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleConfirm}
                    startIcon={<ShoppingBag size={20} strokeWidth={2.5} />}
                    sx={{
                        bgcolor: 'var(--secondary)',
                        color: 'white',
                        py: 2,
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        '&:hover': {
                            bgcolor: '#000',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                        },
                        display: 'flex',
                        justifyContent: 'space-between',
                        px: 4,
                        transition: 'all 0.3s'
                    }}
                >
                    <span>Adicionar</span>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.2rem' }}>
                        R$ {totalPrice.toFixed(2)}
                    </Typography>
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ItemDetailsModal;

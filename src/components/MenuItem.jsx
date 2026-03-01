import React from 'react';
import {
    Card,
    CardMedia,
    Typography,
    Box,
    Chip,
    Stack,
    IconButton
} from '@mui/material';
import { Plus } from 'lucide-react';

const MenuItem = ({ name, description, price, imageUrl, onAdd, allergens = [] }) => {
    return (
        <Card
            elevation={0}
            onClick={onAdd}
            sx={{
                display: 'flex',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                mb: 2.5,
                overflow: 'hidden',
                bgcolor: 'var(--card-bg)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 'var(--shadow-lg)',
                    borderColor: 'var(--primary)',
                    '& .add-btn': {
                        bgcolor: 'var(--primary)',
                        color: '#fff',
                        transform: 'rotate(90deg) scale(1.1)',
                    }
                }
            }}
        >
            {/* Image and Price Overlay (Mobile Friendly Side Layout) */}
            <Box sx={{ position: 'relative', width: { xs: 120, sm: 140 }, minWidth: { xs: 120, sm: 140 } }}>
                <CardMedia
                    component="img"
                    image={imageUrl || 'https://placehold.co/140x140?text=🍽️'}
                    alt={name}
                    sx={{ height: '100%', objectFit: 'cover' }}
                />
                <Box sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    bgcolor: 'rgba(26, 26, 26, 0.8)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    px: 1,
                    py: 0.4,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                }}>
                    R$ {typeof price === 'number' ? price.toFixed(2) : parseFloat(price ?? 0).toFixed(2)}
                </Box>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2, mb: 0.5, fontSize: '1.05rem' }}>
                        {name}
                    </Typography>
                    <Typography variant="body2" sx={{
                        color: 'var(--text-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        mb: 1.5,
                    }}>
                        {description}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Allergen chips - Minimal style */}
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {allergens?.slice(0, 2).map((allergen) => (
                            <Box
                                key={allergen}
                                sx={{
                                    fontSize: '0.65rem',
                                    px: 1,
                                    py: 0.3,
                                    borderRadius: '6px',
                                    color: '#8B4513',
                                    bgcolor: '#FFF8E1',
                                    fontWeight: 800,
                                    textTransform: 'uppercase'
                                }}
                            >
                                {allergen}
                            </Box>
                        ))}
                    </Stack>

                    {/* Add button */}
                    <IconButton
                        className="add-btn"
                        size="small"
                        sx={{
                            bgcolor: '#FFF5E6',
                            color: 'var(--primary)',
                            width: 36,
                            height: 36,
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                            ml: 1,
                        }}
                    >
                        <Plus size={20} strokeWidth={3} />
                    </IconButton>
                </Box>
            </Box>
        </Card>
    );
};

export default MenuItem;

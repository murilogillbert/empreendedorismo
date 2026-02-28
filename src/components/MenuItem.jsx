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
                borderRadius: 2,
                border: '1.5px solid #F0F0F0',
                mb: 2,
                overflow: 'hidden',
                bgcolor: '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px rgba(255, 140, 0, 0.12)',
                    borderColor: '#FF8C00',
                    '& .add-btn': {
                        bgcolor: '#FF8C00',
                        color: '#fff',
                        transform: 'scale(1.1)',
                    }
                }
            }}
        >
            {/* Image and Price */}
            <Box sx={{ minWidth: 110, width: 110, display: 'flex', flexDirection: 'column', bgcolor: '#FAFAFA', borderRight: '1px solid #F0F0F0' }}>
                <CardMedia
                    component="img"
                    image={imageUrl || 'https://placehold.co/110x110?text=🍽️'}
                    alt={name}
                    sx={{ width: 110, height: 110, objectFit: 'cover' }}
                />
                <Box sx={{ py: 1, px: 0.5, textAlign: 'center', mt: 'auto' }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 900, color: '#FF8C00' }}>
                        R$ {typeof price === 'number' ? price.toFixed(2) : parseFloat(price ?? 0).toFixed(2)}
                    </Typography>
                </Box>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A1A1A', lineHeight: 1.25, mb: 0.5 }}>
                        {name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.78rem',
                        lineHeight: 1.45,
                        mb: 1,
                    }}>
                        {description}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    {/* Allergen chips */}
                    {allergens && allergens.length > 0 ? (
                        <Stack direction="row" spacing={0.4} sx={{ flexWrap: 'wrap', gap: 0.4 }}>
                            {allergens.slice(0, 2).map((allergen) => (
                                <Chip
                                    key={allergen}
                                    label={allergen}
                                    size="small"
                                    sx={{
                                        fontSize: '0.6rem',
                                        height: 18,
                                        color: '#9E6B00',
                                        bgcolor: '#FFF3CD',
                                        border: 'none',
                                        fontWeight: 700,
                                        '& .MuiChip-label': { px: 0.8 }
                                    }}
                                />
                            ))}
                            {allergens.length > 2 && (
                                <Chip
                                    label={`+${allergens.length - 2}`}
                                    size="small"
                                    sx={{ fontSize: '0.6rem', height: 18, '& .MuiChip-label': { px: 0.8 } }}
                                />
                            )}
                        </Stack>
                    ) : <Box />}

                    {/* Add button */}
                    <IconButton
                        className="add-btn"
                        size="small"
                        sx={{
                            bgcolor: '#FFF3E0',
                            color: '#FF8C00',
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            ml: 1,
                        }}
                    >
                        <Plus size={16} strokeWidth={2.5} />
                    </IconButton>
                </Box>
            </Box>
        </Card>
    );
};

export default MenuItem;

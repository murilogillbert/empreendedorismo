import React from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Button,
    Stack,
    Chip
} from '@mui/material';
import { Plus } from 'lucide-react';

const MenuItem = ({ name, description, price, imageUrl, onAdd, allergens = [] }) => {
    return (
        <Card
            elevation={0}
            onClick={onAdd}
            sx={{
                display: 'flex',
                borderRadius: 4,
                border: '1px solid #F0F0F0',
                mb: 2,
                overflow: 'hidden',
                bgcolor: '#FFFFFF',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    borderColor: '#FF8C00'
                }
            }}
        >
            {/* Left Side: Image and Price Range */}
            <Stack spacing={1} sx={{ p: 2, width: 120, alignItems: 'center', justifyContent: 'center' }}>
                <CardMedia
                    component="img"
                    image={imageUrl || 'https://placehold.co/100x100?text=No+Image'}
                    alt={name}
                    sx={{ width: 100, height: 100, borderRadius: 2 }}
                />
            </Stack>

            {/* Right Side: Title, Description, and Customization indicator */}
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2 }}>
                        {name}
                    </Typography>
                </Stack>

                <Typography variant="caption" sx={{ fontWeight: 800, color: '#FF8C00', mb: 1 }}>
                    A partir de R$ {price.toFixed(2)}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flexGrow: 1,
                    mb: 1
                }}>
                    {description}
                </Typography>

                {allergens && allergens.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {allergens.map((allergen) => (
                            <Chip
                                key={allergen}
                                label={allergen}
                                size="small"
                                variant="outlined"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 20,
                                    color: '#757575',
                                    borderColor: '#E0E0E0',
                                    '& .MuiChip-label': { px: 1 }
                                }}
                            />
                        ))}
                    </Stack>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                    <Button
                        variant="soft"
                        size="small"
                        startIcon={<Plus size={16} />}
                        sx={{
                            color: '#FF8C00',
                            bgcolor: '#FFF8F0',
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 800,
                            pointerEvents: 'none', // Click handled by Card
                            '& hover': { bgcolor: '#FFF0E0' }
                        }}
                    >
                        Customizar
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default MenuItem;

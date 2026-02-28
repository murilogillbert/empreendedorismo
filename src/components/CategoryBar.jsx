import React from 'react';
import { Box, Stack } from '@mui/material';

const categories = [
    { id: 'all', name: 'Todos', emoji: '🍽️' },
    { id: 'Burgers', name: 'Burgers', emoji: '🍔' },
    { id: 'Drinks', name: 'Bebidas', emoji: '🥤' },
    { id: 'Sides', name: 'Acompanhamentos', emoji: '🍟' },
    { id: 'Desserts', name: 'Sobremesas', emoji: '🍰' },
];

const CategoryBar = ({ activeCategory, onCategoryChange }) => {
    return (
        <Box sx={{
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            mb: 3,
            py: 0.5,
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
        }}>
            <Stack direction="row" spacing={1}>
                {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                        <Box
                            key={cat.id}
                            onClick={() => onCategoryChange(cat.id)}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.6,
                                px: 2,
                                py: 1,
                                borderRadius: 3,
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap',
                                userSelect: 'none',
                                transition: 'all 0.2s ease',
                                bgcolor: isActive ? '#FF8C00' : '#F5F5F5',
                                color: isActive ? '#FFFFFF' : '#666666',
                                boxShadow: isActive ? '0 4px 12px rgba(255,140,0,0.3)' : 'none',
                                transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                                '&:hover': {
                                    bgcolor: isActive ? '#E67E00' : '#EBEBEB',
                                    transform: 'translateY(-1px)',
                                },
                                fontFamily: 'inherit',
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>{cat.emoji}</span>
                            {cat.name}
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
};

export default CategoryBar;

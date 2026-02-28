import React from 'react';
import { Box, Chip, Stack } from '@mui/material';

const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'Burgers', name: 'Burgers' },
    { id: 'Drinks', name: 'Bebidas' },
    { id: 'Sides', name: 'Acompanhamentos' },
    { id: 'Desserts', name: 'Sobremesas' },
];

const CategoryBar = ({ activeCategory, onCategoryChange }) => {
    return (
        <Box disablebar="true" sx={{
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            mb: 3,
            py: 1,
            '&::-webkit-scrollbar': {
                display: 'none'
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
        }}>
            <Stack direction="row" spacing={1.5}>
                {categories.map((cat) => (
                    <Chip
                        key={cat.id}
                        label={cat.name}
                        onClick={() => onCategoryChange(cat.id)}
                        sx={{
                            px: 1.5,
                            py: 2.5,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            bgcolor: activeCategory === cat.id ? '#FF8C00' : '#F5F5F5',
                            color: activeCategory === cat.id ? '#FFFFFF' : '#757575',
                            border: 'none',
                            borderRadius: 4,
                            '&:hover': {
                                bgcolor: activeCategory === cat.id ? '#E67E00' : '#EEEEEE',
                            },
                            '& .MuiChip-label': {
                                padding: '0 12px'
                            }
                        }}
                    />
                ))}
            </Stack>
        </Box>
    );
};

export default CategoryBar;

import React, { useState, useEffect } from 'react';
import { Typography, Stack, Box, Snackbar, Alert, Chip } from '@mui/material';
import CategoryBar from '../components/CategoryBar';
import MenuItem from '../components/MenuItem';
import ItemDetailsModal from '../components/ItemDetailsModal';
import { addToOrder } from '../utils/orderStore';
import { getMenu } from '../utils/menuStore';

const Menu = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedAllergens, setSelectedAllergens] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [menuItems, setMenuItems] = useState([]);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItemForModal, setSelectedItemForModal] = useState(null);

    const allergensList = ['Glúten', 'Lactose', 'Amendoim', 'Ovos', 'Peixes', 'Soja'];

    useEffect(() => {
        const fetchMenu = async () => {
            const data = await getMenu();
            setMenuItems(data);
        };
        fetchMenu();
    }, []);

    const handleOpenModal = (item) => {
        setSelectedItemForModal(item);
        setModalOpen(true);
    };

    const handleConfirmAdd = async (item, addons, observations, quantity) => {
        try {
            for (let i = 0; i < quantity; i++) {
                await addToOrder(item, addons, observations);
            }
            setOpenSnackbar(true);
        } catch (error) {
            console.error('Error adding to order:', error);
        }
    };

    const toggleAllergen = (allergen) => {
        setSelectedAllergens(prev =>
            prev.includes(allergen)
                ? prev.filter(a => a !== allergen)
                : [...prev, allergen]
        );
    };

    const getFilteredItems = () => {
        let items = menuItems;

        // Category filter
        if (activeCategory !== 'all') {
            items = items.filter(i => i.category === activeCategory);
        }

        // Allergen EXCLUSION filter
        if (selectedAllergens.length > 0) {
            items = items.filter(item => {
                // If the item contains ANY of the selected allergens to exclude
                const itemAllergens = item.allergens || [];
                return !selectedAllergens.some(selected => itemAllergens.includes(selected));
            });
        }

        return items;
    };

    return (
        <Box sx={{ pb: 8 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1A1A1A' }}>
                    Nosso Cardápio
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                    Escolha seus pratos favoritos 🍽️
                </Typography>
            </Box>

            <CategoryBar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
            />

            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: '#999', letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    🚫 Remover alérgenos
                </Typography>
                <Box sx={{
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    pb: 1,
                    '&::-webkit-scrollbar': { display: 'none' }
                }}>
                    <Stack direction="row" spacing={0.8}>
                        {allergensList.map(allergen => {
                            const active = selectedAllergens.includes(allergen);
                            return (
                                <Chip
                                    key={allergen}
                                    label={allergen}
                                    onClick={() => toggleAllergen(allergen)}
                                    variant={active ? 'filled' : 'outlined'}
                                    sx={{
                                        bgcolor: active ? '#1A1A1A' : 'transparent',
                                        color: active ? 'white' : '#888',
                                        borderColor: active ? '#1A1A1A' : '#DDD',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        transition: 'all 0.18s ease',
                                        '&:hover': {
                                            bgcolor: active ? '#333' : '#F5F5F5',
                                        }
                                    }}
                                />
                            );
                        })}
                    </Stack>
                </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
                {getFilteredItems().map(item => (
                    <MenuItem
                        key={item.id}
                        name={item.name}
                        description={item.description}
                        price={item.price}
                        imageUrl={item.image}
                        allergens={item.allergens}
                        onAdd={() => handleOpenModal(item)}
                    />
                ))}
            </Box>

            <ItemDetailsModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                item={selectedItemForModal}
                onAdd={handleConfirmAdd}
            />

            <Snackbar
                open={openSnackbar}
                autoHideDuration={2000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}>
                    Item adicionado ao pedido!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Menu;

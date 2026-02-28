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
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                Nosso Cardápio
            </Typography>

            <CategoryBar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
            />

            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                    REMOVER ITENS COM ALÉRGENOS:
                </Typography>
                <Box disablebar="true" sx={{
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    pb: 1,
                    '&::-webkit-scrollbar': { display: 'none' }
                }}>
                    <Stack direction="row" spacing={1}>
                        {allergensList.map(allergen => (
                            <Chip
                                key={allergen}
                                label={allergen}
                                onClick={() => toggleAllergen(allergen)}
                                variant={selectedAllergens.includes(allergen) ? 'filled' : 'outlined'}
                                sx={{
                                    bgcolor: selectedAllergens.includes(allergen) ? '#1A1A1A' : 'transparent',
                                    color: selectedAllergens.includes(allergen) ? 'white' : '#757575',
                                    borderColor: '#DDD',
                                    fontWeight: 700,
                                    fontSize: '0.75rem'
                                }}
                            />
                        ))}
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

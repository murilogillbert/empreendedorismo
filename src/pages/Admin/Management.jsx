import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    Grid,
    Stack,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tab,
    Tabs,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Snackbar,
    Alert,
    Avatar,
    Chip,
    FormControl,
    InputLabel,
    Select,
    OutlinedInput,
    MenuItem as MuiMenuItem
} from '@mui/material';
import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Plus,
    Edit,
    Trash2,
    ArrowLeft,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../../utils/menuStore';
import { getOrders } from '../../utils/orderStore';
import { getOrderHistory } from '../../utils/userStore';

const Management = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [menuItems, setMenuItems] = useState([]);
    const [history, setHistory] = useState([]);

    // CRUD State
    const [openDialog, setOpenDialog] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        allergens: [],
        ingredients: '', // Will handle as comma-separated string in form
        addons: []
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const menu = await getMenu();
            setMenuItems(menu);

            const liveOrders = await getOrders();
            // Map live orders to match the 'history' format expected by KPIs
            const mappedHistory = liveOrders.map(o => ({
                id: o.id,
                total: parseFloat(o.finalPrice || o.price),
                status: o.status,
                items: [o.name],
                date: new Date(o.timestamp).toISOString().split('T')[0]
            }));
            setHistory(mappedHistory);
        };
        fetchData();
    }, []);

    // KPI Metrics calculation
    const totalRevenue = history.reduce((acc, curr) => acc + curr.total, 0);
    const totalOrders = history.length;

    const chartData = [
        { name: 'Seg', v: 400 },
        { name: 'Ter', v: 300 },
        { name: 'Qua', v: 200 },
        { name: 'Qui', v: 278 },
        { name: 'Sex', v: 189 },
        { name: 'Sab', v: 239 },
        { name: 'Dom', v: 349 },
    ];

    const categoryData = [
        { name: 'Burgers', value: 45 },
        { name: 'Drinks', value: 25 },
        { name: 'Sides', value: 20 },
        { name: 'Deserts', value: 10 },
    ];
    const COLORS = ['#FF8C00', '#1A1A1A', '#757575', '#CCCCCC'];

    const handleOpenDialog = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                ...item,
                allergens: item.allergens || [],
                ingredients: (item.ingredients || []).join(', '),
                addons: item.addons || []
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: 'Burgers',
                image: '',
                allergens: [],
                ingredients: '',
                addons: []
            });
        }
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price || !formData.category) {
            alert('Por favor, preencha nome, preço e categoria.');
            return;
        }

        const itemToSave = {
            ...formData,
            ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
            price: parseFloat(formData.price)
        };

        if (editingItem) {
            await updateMenuItem(itemToSave);
            setSnackbarMsg('Item atualizado com sucesso!');
        } else {
            await addMenuItem(itemToSave);
            setSnackbarMsg('Item adicionado ao cardápio!');
        }

        const freshMenu = await getMenu();
        setMenuItems(freshMenu);
        setOpenDialog(false);
        setOpenSnackbar(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Excluir este item?')) {
            await deleteMenuItem(id);
            const freshMenu = await getMenu();
            setMenuItems(freshMenu);
            setSnackbarMsg('Item removido.');
            setOpenSnackbar(true);
        }
    };

    return (
        <Box sx={{ p: 4, bgcolor: '#FDFDFD', minHeight: '100vh', pb: 10 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>Management Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">Seja bem-vindo, Administrador.</Typography>
                </Box>
                <Button startIcon={<ArrowLeft />} onClick={() => navigate('/admin')}>Painel Admin</Button>
            </Stack>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 3, borderRadius: 4, bgcolor: '#1A1A1A', color: 'white' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ bgcolor: 'rgba(255,140,0,0.2)', p: 1.5, borderRadius: 3 }}>
                                <DollarSign color="#FF8C00" />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Receita Total</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>R$ {totalRevenue.toFixed(2)}</Typography>
                            </Box>
                        </Stack>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 3, borderRadius: 4, border: '1px solid #F0F0F0' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ bgcolor: '#FFF5E6', p: 1.5, borderRadius: 3 }}>
                                <ShoppingBag color="#FF8C00" />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Vendas Feitas</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>{totalOrders}</Typography>
                            </Box>
                        </Stack>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 3, borderRadius: 4, border: '1px solid #F0F0F0' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ bgcolor: '#F0F0F0', p: 1.5, borderRadius: 3 }}>
                                <TrendingUp color="#1A1A1A" />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Crescimento Mes</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>+12.4%</Typography>
                            </Box>
                        </Stack>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="primary" indicatorColor="primary">
                    <Tab label="Overview" icon={<BarChartIcon size={18} />} iconPosition="start" />
                    <Tab label="Cardápio (CRUD)" icon={<Plus size={18} />} iconPosition="start" />
                    <Tab label="Histórico" icon={<PieChartIcon size={18} />} iconPosition="start" />
                </Tabs>
            </Box>

            {tab === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card sx={{ p: 3, borderRadius: 4, border: '1px solid #F0F0F0', minHeight: 400 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Receita Semanal (R$)</Typography>
                            <Box sx={{ height: 300, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#F5F5F5' }} />
                                        <Bar dataKey="v" fill="#FF8C00" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ p: 3, borderRadius: 4, border: '1px solid #F0F0F0', minHeight: 400 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Vendas por Categoria</Typography>
                            <Box sx={{ height: 300, width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {tab === 1 && (
                <Box>
                    <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<Plus />}
                            onClick={() => handleOpenDialog()}
                        >
                            Novo Item
                        </Button>
                    </Stack>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #F0F0F0', borderRadius: 4 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#F8F9FA' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Preço</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {menuItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar src={item.image} variant="rounded" sx={{ width: 40, height: 40 }} />
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {item.description}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{item.category}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>R$ {item.price.toFixed(2)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(item)} size="small" sx={{ mr: 1, color: '#FF8C00' }}>
                                                <Edit size={18} />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(item.id)} size="small" color="error">
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {tab === 2 && (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #F0F0F0', borderRadius: 4 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#F8F9FA' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>ID Pedido</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Itens</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Valor</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {history.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell sx={{ fontWeight: 700 }}>{order.id}</TableCell>
                                    <TableCell>{order.date}</TableCell>
                                    <TableCell>
                                        <Typography variant="caption">{order.items.join(', ')}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>R$ {order.total.toFixed(2)}</TableCell>
                                    <TableCell align="right">
                                        <Chip label={order.status} size="small" color="success" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Item Editor Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Nome do Item"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label="Descrição"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Preço (R$)"
                                    type="number"
                                    fullWidth
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    select
                                    label="Categoria"
                                    fullWidth
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <MuiMenuItem value="Burgers">Burgers</MuiMenuItem>
                                    <MuiMenuItem value="Drinks">Drinks (Bebidas)</MuiMenuItem>
                                    <MuiMenuItem value="Sides">Sides (Acompanhamentos)</MuiMenuItem>
                                    <MuiMenuItem value="Desserts">Desserts (Sobremesas)</MuiMenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                        <TextField
                            label="URL da Imagem"
                            fullWidth
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        />

                        <TextField
                            label="Ingredientes (separados por vírgula)"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.ingredients}
                            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                            placeholder="Ex: Carne, Pão, Alface..."
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Adicionais Pagos</Typography>
                            {formData.addons.map((addon, index) => (
                                <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }}>
                                    <TextField
                                        size="small"
                                        label="Nome"
                                        value={addon.name}
                                        onChange={(e) => {
                                            const newAddons = [...formData.addons];
                                            newAddons[index].name = e.target.value;
                                            setFormData({ ...formData, addons: newAddons });
                                        }}
                                    />
                                    <TextField
                                        size="small"
                                        label="Preço"
                                        type="number"
                                        value={addon.price}
                                        onChange={(e) => {
                                            const newAddons = [...formData.addons];
                                            newAddons[index].price = parseFloat(e.target.value);
                                            setFormData({ ...formData, addons: newAddons });
                                        }}
                                        sx={{ width: 100 }}
                                    />
                                    <IconButton color="error" onClick={() => {
                                        const newAddons = formData.addons.filter((_, i) => i !== index);
                                        setFormData({ ...formData, addons: newAddons });
                                    }}>
                                        <Trash2 size={18} />
                                    </IconButton>
                                </Stack>
                            ))}
                            <Button
                                startIcon={<Plus size={16} />}
                                size="small"
                                onClick={() => setFormData({ ...formData, addons: [...formData.addons, { name: '', price: 0 }] })}
                            >
                                Novo Adicional
                            </Button>
                        </Box>

                        <FormControl fullWidth>
                            <InputLabel>Alérgenos</InputLabel>
                            <Select
                                multiple
                                value={formData.allergens || []}
                                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                                input={<OutlinedInput label="Alérgenos" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))}
                                    </Box>
                                )}
                            >
                                {['Glúten', 'Lactose', 'Amendoim', 'Ovos', 'Peixes', 'Soja'].map((name) => (
                                    <MuiMenuItem key={name} value={name}>
                                        {name}
                                    </MuiMenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {formData.image && (
                            <Box sx={{ mt: 1, textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                    Prévia da Imagem:
                                </Typography>
                                <Box
                                    component="img"
                                    src={formData.image}
                                    sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 2, border: '1px solid #EEE' }}
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
                    <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#FF8C00', '&:hover': { bgcolor: '#E67E00' } }}>
                        {editingItem ? 'Salvar Alterações' : 'Criar Item'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" sx={{ width: '100%', borderRadius: 2, fontWeight: 700 }}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Management;

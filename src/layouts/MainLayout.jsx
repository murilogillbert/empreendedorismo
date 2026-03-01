import React from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Container,
    BottomNavigation,
    BottomNavigationAction,
    Paper
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    UtensilsCrossed,
    ShoppingBag,
    Receipt,
    UserCircle,
    ScanLine,
    LogOut
} from 'lucide-react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import { getTableSession, joinTable, clearTableSession } from '../utils/tableStore';

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: 'Menu', icon: <UtensilsCrossed size={20} />, path: '/menu' },
        { label: 'Orders', icon: <ShoppingBag size={20} />, path: '/orders' },
        { label: 'Bill', icon: <Receipt size={20} />, path: '/bill' },
        { label: 'Profile', icon: <UserCircle size={20} />, path: '/profile' },
    ];

    const currentPath = location.pathname;
    const activeValue = navItems.findIndex(item => item.path === currentPath);

    const [tableSession, setTableSession] = React.useState(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [tableCode, setTableCode] = React.useState('');
    const [errorMsg, setErrorMsg] = React.useState('');

    React.useEffect(() => {
        setTableSession(getTableSession());
    }, []);

    const handleJoinTable = async () => {
        try {
            setErrorMsg('');
            if (!tableCode.trim()) {
                setErrorMsg('Digite um código válido.');
                return;
            }
            const sessionData = await joinTable(tableCode.trim().toUpperCase());
            setTableSession(sessionData);
            setOpenModal(false);
            setTableCode('');
        } catch (e) {
            setErrorMsg(e.message || 'Erro ao entrar na mesa.');
        }
    };

    const handleLeaveTable = () => {
        clearTableSession();
        setTableSession(null);
        navigate('/menu');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#FFFFFF' }}>
            {/* Header */}
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #EEEEEE' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 900, color: '#1A1A1A', cursor: 'pointer' }} onClick={() => navigate('/menu')}>
                        RESTAURANTE <Box component="span" sx={{ color: '#FF8C00' }}>APP</Box>
                    </Typography>

                    {tableSession ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ bgcolor: '#FFF5E6', px: 2, py: 0.5, borderRadius: 2, border: '1px solid #FFE0B2' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#FF8C00' }}>
                                    MESA {tableSession.tableCode}
                                </Typography>
                            </Box>
                            <IconButton size="small" onClick={handleLeaveTable} color="error">
                                <LogOut size={18} />
                            </IconButton>
                        </Box>
                    ) : (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ScanLine size={16} />}
                            onClick={() => setOpenModal(true)}
                            sx={{
                                borderColor: '#FF8C00',
                                color: '#FF8C00',
                                fontWeight: 700,
                                borderRadius: 2,
                                '&:hover': { borderColor: '#E67E00', bgcolor: '#FFF5E6' }
                            }}
                        >
                            Vincular Mesa
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            {/* Modal de Mesa */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>Vincular Mesa</DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Digite o código da mesa ou aponte a câmera para o QR Code (Em breve).
                        </Typography>
                    </Box>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Código da Mesa (ex: MESA-01)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={tableCode}
                        onChange={(e) => setTableCode(e.target.value)}
                        error={!!errorMsg}
                        helperText={errorMsg}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleJoinTable} variant="contained" sx={{ bgcolor: '#FF8C00', fontWeight: 700, '&:hover': { bgcolor: '#E67E00' } }}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Main Content */}
            <Container component="main" maxWidth="sm" sx={{ flexGrow: 1, py: 3, pb: 10 }}>
                <Outlet />
            </Container>

            {/* Footer Navigation */}
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
                <BottomNavigation
                    showLabels
                    value={activeValue >= 0 ? activeValue : 0}
                    onChange={(event, newValue) => {
                        navigate(navItems[newValue].path);
                    }}
                    sx={{
                        height: 70,
                        '& .Mui-selected': {
                            color: '#FF8C00 !important',
                            '& .MuiBottomNavigationAction-label': {
                                fontWeight: 700,
                            }
                        },
                        '& .MuiBottomNavigationAction-root': {
                            color: '#757575',
                        }
                    }}
                >
                    {navItems.map((item) => (
                        <BottomNavigationAction
                            key={item.label}
                            label={item.label}
                            icon={item.icon}
                        />
                    ))}
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default MainLayout;

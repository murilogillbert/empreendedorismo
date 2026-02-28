import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { CheckCircle2 } from 'lucide-react';

const Success = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // If it's a pool payment, mark it as paid in the store (in a real app, webhook does this)
        const poolId = searchParams.get('pool_id');
        const amount = searchParams.get('amount');
        const name = searchParams.get('name');

        if (poolId && amount && name) {
            import('../utils/orderStore').then(({ addContribution }) => {
                addContribution(poolId, parseFloat(amount), name);
            });
        }

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    navigate('/menu');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [navigate, searchParams]);

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#FAFAFA',
            p: 3,
            textAlign: 'center'
        }}>
            <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#e8f5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
            }}>
                <CheckCircle2 size={48} color="#2e7d32" />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#1A1A1A' }}>
                Pagamento Confirmado!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
                Sua parte da conta foi paga com sucesso. Muito obrigado e volte sempre!
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <CircularProgress variant="determinate" value={(countdown / 10) * 100} size={24} sx={{ color: '#FF8C00' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF8C00' }}>
                    Redirecionando ao menu principal em {countdown}s...
                </Typography>
            </Box>

            <Button
                variant="outlined"
                onClick={() => navigate('/menu')}
                sx={{
                    borderRadius: 4,
                    borderColor: '#DDD',
                    color: '#666',
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4
                }}
            >
                Voltar Agora
            </Button>
        </Box>
    );
};

export default Success;

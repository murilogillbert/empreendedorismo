import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { CheckCircle2, Receipt } from 'lucide-react';
import ky from 'ky';

const Success = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [countdown, setCountdown] = useState(10);
    const [paymentType, setPaymentType] = useState(null); // 'direct' or 'pool'
    const hasFired = useRef(false);

    useEffect(() => {
        const confirmPayment = async () => {
            const type = searchParams.get('type'); // 'direct' or null (pool)
            setPaymentType(type || 'pool');

            if (hasFired.current) return;
            hasFired.current = true;

            const poolId = searchParams.get('pool_id');
            const amount = searchParams.get('amount');
            const name = searchParams.get('name');
            const userId = searchParams.get('user_id');

            if (poolId && amount && name) {
                try {
                    // Agora unificado: tanto direto quanto pool usam /api/pool/confirm
                    // porque agora o 'Pagar Integral' também cria uma pool prévia.
                    await ky.post('http://localhost:4242/api/pool/confirm', {
                        json: {
                            poolId,
                            amount: parseFloat(amount),
                            contributorName: name,
                            userId: userId ? parseInt(userId) : null
                        }
                    });
                } catch (e) {
                    console.error('Error confirming payment:', e);
                }
            }
        };

        confirmPayment();

        // Para pagamento direto: volta para /bill (o cliente continua na mesa)
        // Para pool: vai para /menu (o contribuidor pode sair)
        const type = searchParams.get('type');
        const redirectTo = type === 'direct' ? '/bill' : '/menu';

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    navigate(redirectTo);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [navigate, searchParams]);

    const isDirect = paymentType === 'direct';

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
                {isDirect
                    ? 'Conta paga! Você ainda está na mesa. Aproveite o restante da sua visita!'
                    : 'Sua parte da conta foi paga com sucesso. Muito obrigado e volte sempre!'
                }
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <CircularProgress variant="determinate" value={(countdown / 10) * 100} size={24} sx={{ color: '#FF8C00' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF8C00' }}>
                    {isDirect
                        ? `Voltando para a conta em ${countdown}s...`
                        : `Redirecionando ao menu principal em ${countdown}s...`
                    }
                </Typography>
            </Box>

            <Button
                variant="outlined"
                startIcon={isDirect ? <Receipt size={18} /> : undefined}
                onClick={() => navigate(isDirect ? '/bill' : '/menu')}
                sx={{
                    borderRadius: 4,
                    borderColor: '#DDD',
                    color: '#666',
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4
                }}
            >
                {isDirect ? 'Ver Minha Conta' : 'Voltar Agora'}
            </Button>
        </Box>
    );
};

export default Success;

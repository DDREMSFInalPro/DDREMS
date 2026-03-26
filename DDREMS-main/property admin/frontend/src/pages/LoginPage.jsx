import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  HomeWork,
  LockOutlined,
} from '@mui/icons-material';
import { login, clearError } from '../store/slices/authSlice.js';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoading, error, token } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const redirectReason = searchParams.get('reason');
  const sessionMessage =
    redirectReason === 'timeout'
      ? 'Your session expired due to inactivity. Please sign in again.'
      : redirectReason === 'unauthorized'
      ? 'Your session is no longer valid. Please sign in again.'
      : null;

  // Redirect if already authenticated
  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  // Clear redux error when user starts typing
  useEffect(() => {
    if (error) dispatch(clearError());
  }, [form.email, form.password]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    dispatch(login({ email: form.email, password: form.password }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 40%, #1565c0 100%)',
        p: 2,
      }}
    >
      <Card
        elevation={12}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 3,
          overflow: 'visible',
        }}
      >
        {/* Header banner */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
            borderRadius: '12px 12px 0 0',
            py: 3,
            px: 3,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <HomeWork sx={{ fontSize: 48, mb: 1, opacity: 0.95 }} />
          <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
            Dire Dawa Real Estate
          </Typography>
          <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
            Management System
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
            Property Administration Portal
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Lock icon */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 3,
              }}
            >
              <LockOutlined sx={{ color: 'white', fontSize: 26 }} />
            </Box>
          </Box>

          <Typography variant="h6" textAlign="center" fontWeight={600} mb={0.5}>
            Admin Sign In
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
            Enter your credentials to access the portal
          </Typography>

          {sessionMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {sessionMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              disabled={isLoading}
              autoComplete="current-password"
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d47a1, #0a3880)',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
            Authorized personnel only. Unauthorized access is prohibited.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

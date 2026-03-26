import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  VerifiedUser,
  Assessment,
  HomeWork,
  KeyboardArrowDown,
  Logout,
  AccountCircle,
  FolderOpen,
  Chat,
  People,
  Business,
  PersonSearch,
  Gavel,
  TrendingUp,
  Warning,
  SupervisorAccount,
  PendingActions,
} from '@mui/icons-material';
import { logout } from '../store/slices/authSlice.js';
import NotificationBell from './NotificationBell.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Verification', icon: <VerifiedUser />, path: '/verification' },
  { label: 'Requests', icon: <PendingActions />, path: '/requests' },
  { label: 'Documents', icon: <FolderOpen />, path: '/documents' },
  { label: 'Messages', icon: <Chat />, path: '/messages' },
  { label: 'Property Owners', icon: <Business />, path: '/owners' },
  { label: 'Buyers', icon: <People />, path: '/buyers' },
  { label: 'Renters', icon: <PersonSearch />, path: '/renters' },
  { label: 'Agreements', icon: <Gavel />, path: '/agreements' },
  { label: 'Brokers', icon: <SupervisorAccount />, path: '/brokers' },
  { label: 'Price AI', icon: <TrendingUp />, path: '/price-recommendations' },
  { label: 'Fraud Alerts', icon: <Warning />, path: '/fraud-alerts' },
  { label: 'Compliance', icon: <Gavel />, path: '/compliance' },
  { label: 'Reports', icon: <Assessment />, path: '/reports' },
];

export default function MainLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user } = useSelector((state) => state.auth);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Drawer header */}
      <Box
        sx={{
          px: 2,
          py: 2.5,
          background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <HomeWork sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
            DDREMS
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Property Admin
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Nav items */}
      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {NAV_ITEMS.map(({ label, icon, path }) => {
          const active = location.pathname === path;
          return (
            <ListItemButton
              key={path}
              selected={active}
              onClick={() => {
                navigate(path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} slotProps={{ primary: { fontWeight: active ? 600 : 400 } }} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* Bottom logout shortcut */}
      <List sx={{ px: 1, pb: 1 }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 38, color: 'error.main' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #1a237e, #1565c0)',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen((v) => !v)}
              sx={{ mr: 1 }}
              aria-label="Open navigation menu"
            >
              <MenuIcon />
            </IconButton>
          )}

          <HomeWork sx={{ mr: 1.5, display: { xs: 'none', sm: 'block' } }} />
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ flexGrow: 1, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}
          >
            Dire Dawa Real Estate Management System
          </Typography>

          {/* User menu */}
          <LanguageSwitcher />
          <NotificationBell />
          <Tooltip title="Account options">
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 1,
                py: 0.5,
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <Avatar
                sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.25)', fontSize: '0.9rem' }}
              >
                {user?.name?.charAt(0).toUpperCase() || <AccountCircle />}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.75, textTransform: 'capitalize' }}>
                  {user?.role}
                </Typography>
              </Box>
              <KeyboardArrowDown sx={{ fontSize: 18, opacity: 0.8 }} />
            </Box>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{ paper: { sx: { mt: 1, minWidth: 180 } } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1 }}>
              <Logout fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Persistent drawer — desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', top: '64px', height: 'calc(100% - 64px)' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Temporary drawer — mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          ml: { md: `${DRAWER_WIDTH}px` },
          p: { xs: 2, sm: 3 },
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

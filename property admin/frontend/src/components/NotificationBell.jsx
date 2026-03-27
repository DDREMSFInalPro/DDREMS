import { useState, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  IconButton, Badge, Popover, Box, Typography, List, ListItemButton,
  ListItemText, Divider, Button, Chip,
} from '@mui/material';
import { Notifications, CheckCircle, Cancel } from '@mui/icons-material';
import { markAllRead, clearNotifications } from '../store/slices/socketSlice.js';

const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useSelector((s) => s.socket);
  const [anchor, setAnchor] = useState(null);

  const handleOpen = (e) => {
    setAnchor(e.currentTarget);
    dispatch(markAllRead());
  };

  const handleClose = () => setAnchor(null);

  const handleItemClick = (n) => {
    handleClose();
    if (n.propertyId) navigate(`/verification/${n.propertyId}`);
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-label="Notifications">
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <Notifications />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
          {notifications.length > 0 && (
            <Button size="small" onClick={() => dispatch(clearNotifications())} sx={{ fontSize: '0.7rem' }}>
              Clear all
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Notifications sx={{ fontSize: 36, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2">No notifications yet</Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ overflow: 'auto', maxHeight: 340 }}>
            {notifications.map((n, i) => (
              <Box key={n.id}>
                <ListItemButton onClick={() => handleItemClick(n)} sx={{ py: 1.5, px: 2 }}>
                  <Box sx={{ mr: 1.5, color: n.type === 'verified' ? 'success.main' : 'error.main' }}>
                    {n.type === 'verified' ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                  </Box>
                  <ListItemText
                    primary={<Typography variant="body2">{n.message}</Typography>}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={n.type}
                          size="small"
                          color={n.type === 'verified' ? 'success' : 'error'}
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {fmtTime(n.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
                {i < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}

export default memo(NotificationBell);

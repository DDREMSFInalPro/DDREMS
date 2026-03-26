import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography,
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import { useState } from 'react';

export default function RejectDialog({ open, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const hasError = touched && !reason.trim();

  const handleConfirm = () => {
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
    setTouched(false);
  };

  const handleClose = () => {
    setReason('');
    setTouched(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <Cancel /> Reject Property
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          You are about to <strong>REJECT</strong> this property. A reason is required and will be
          visible to the property owner.
        </Typography>
        <TextField
          fullWidth
          required
          multiline
          rows={4}
          label="Rejection Reason"
          placeholder="Explain why this property is being rejected…"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setTouched(true); }}
          error={hasError}
          helperText={hasError ? 'Rejection reason is required' : ''}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? 'Rejecting…' : 'Confirm Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

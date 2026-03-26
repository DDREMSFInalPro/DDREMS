import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useState } from 'react';

export default function ApproveDialog({ open, onClose, onConfirm, loading }) {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes('');
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
        <CheckCircle /> Approve Property
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          You are about to mark this property as <strong>VERIFIED</strong>. This action will be
          logged in the audit trail.
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes (optional)"
          placeholder="Add any approval notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? 'Approving…' : 'Confirm Approval'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

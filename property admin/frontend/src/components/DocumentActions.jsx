import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Typography, Alert, Box, IconButton, Menu, MenuItem,
  ListItemIcon, ListItemText,
} from '@mui/material';
import { CheckCircle, Cancel, Comment, MoreVert, Visibility, Download } from '@mui/icons-material';

// Document Action Menu
export function DocumentActionMenu({ doc, onVerify, onReject, onAddNote, onView, onDownload }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClose = () => setAnchorEl(null);

  const handleAction = (action) => {
    handleClose();
    action();
  };

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => handleAction(() => onView(doc))}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Document</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(() => onDownload(doc))}>
          <ListItemIcon><Download fontSize="small" /></ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        {doc.verificationStatus !== 'VERIFIED' && (
          <MenuItem onClick={() => handleAction(() => onVerify(doc))}>
            <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Verify Document</ListItemText>
          </MenuItem>
        )}
        {doc.verificationStatus !== 'REJECTED' && (
          <MenuItem onClick={() => handleAction(() => onReject(doc))}>
            <ListItemIcon><Cancel fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Reject Document</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleAction(() => onAddNote(doc))}>
          <ListItemIcon><Comment fontSize="small" /></ListItemIcon>
          <ListItemText>Add Note</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

// Verify Document Dialog
export function VerifyDocumentDialog({ open, onClose, onConfirm, document, loading }) {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(document, notes);
    setNotes('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
        <CheckCircle /> Verify Document
      </DialogTitle>
      <DialogContent>
        <Alert severity="success" sx={{ mb: 2 }}>
          You are about to mark this document as <strong>VERIFIED</strong>.
        </Alert>
        {document && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Document: {document.fileName}</Typography>
            <Typography variant="body2" color="text.secondary">Property: {document.propertyTitle}</Typography>
          </Box>
        )}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Verification Notes (optional)"
          placeholder="Add any notes about this verification…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" color="success" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Verifying…' : 'Confirm Verification'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Reject Document Dialog
export function RejectDocumentDialog({ open, onClose, onConfirm, document, loading }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const hasError = touched && !reason.trim();

  const handleConfirm = () => {
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(document, reason.trim());
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
        <Cancel /> Reject Document
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          You are about to <strong>REJECT</strong> this document. A reason is required.
        </Alert>
        {document && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Document: {document.fileName}</Typography>
            <Typography variant="body2" color="text.secondary">Property: {document.propertyTitle}</Typography>
          </Box>
        )}
        <TextField
          fullWidth
          required
          multiline
          rows={4}
          label="Rejection Reason"
          placeholder="Explain why this document is being rejected…"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setTouched(true); }}
          error={hasError}
          helperText={hasError ? 'Rejection reason is required' : ''}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Rejecting…' : 'Confirm Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Add Note Dialog
export function AddNoteDialog({ open, onClose, onConfirm, document, loading }) {
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (!note.trim()) return;
    onConfirm(document, note.trim());
    setNote('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Comment /> Add Note to Document
      </DialogTitle>
      <DialogContent>
        {document && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Document: {document.fileName}</Typography>
            <Typography variant="body2" color="text.secondary">Property: {document.propertyTitle}</Typography>
          </Box>
        )}
        <TextField
          fullWidth
          required
          multiline
          rows={4}
          label="Note"
          placeholder="Add your note or comment…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={loading || !note.trim()}>
          {loading ? 'Saving…' : 'Save Note'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Document Preview Dialog
export function DocumentPreviewDialog({ open, onClose, document }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" noWrap>{document?.fileName}</Typography>
        <Typography variant="caption" color="text.secondary">{document?.propertyTitle}</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography color="text.secondary">
            Document preview would appear here
            <br />
            <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => window.open(document?.url, '_blank')}>
              Open in New Tab
            </Button>
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

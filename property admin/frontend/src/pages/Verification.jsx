import { useEffect, useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, MenuItem, Select, FormControl,
  InputLabel, InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Button,
  Skeleton, Alert, Checkbox, Toolbar, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TablePagination,
} from '@mui/material';
import { Search, Inbox, CheckCircle, Cancel, Add } from '@mui/icons-material';
import {
  fetchPendingVerifications,
  bulkVerificationAction,
  clearBulkResult,
  clearActionError,
} from '../store/slices/verificationSlice.js';
import { useDebounce } from '../utils/useDebounce.js';

const STATUS_COLORS = {
  PENDING:   { color: 'warning', label: 'Pending' },
  IN_REVIEW: { color: 'info',    label: 'In Review' },
  VERIFIED:  { color: 'success', label: 'Verified' },
  REJECTED:  { color: 'error',   label: 'Rejected' },
};

const PROPERTY_TYPES = ['All', 'residential', 'commercial', 'land', 'industrial'];
const fmt = (n) => n != null ? `ETB ${Number(n).toLocaleString()}` : '—';
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ── Memoized table row ────────────────────────────────────────────────────────
const PropertyRow = memo(function PropertyRow({ p, isChecked, onToggle, onReview }) {
  const status = STATUS_COLORS[p.verificationStatus] || STATUS_COLORS.PENDING;
  return (
    <TableRow hover selected={isChecked} sx={{ '&:last-child td': { border: 0 } }}>
      <TableCell padding="checkbox">
        <Checkbox checked={isChecked} onChange={() => onToggle(p._id)} />
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
          {p.title}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{p.owner?.name ?? '—'}</Typography>
        <Typography variant="caption" color="text.secondary">{p.owner?.email ?? ''}</Typography>
      </TableCell>
      <TableCell sx={{ textTransform: 'capitalize' }}>{p.type ?? '—'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(p.price)}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(p.createdAt)}</TableCell>
      <TableCell>
        <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600 }} />
      </TableCell>
      <TableCell>
        <Button
          variant="contained"
          size="small"
          onClick={() => onReview(p._id)}
          sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}
        >
          Review
        </Button>
      </TableCell>
    </TableRow>
  );
});

// ── Main component ────────────────────────────────────────────────────────────
export default function Verification() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    pendingProperties, pagination, isLoading, error,
    bulkLoading, bulkResult, actionError,
  } = useSelector((s) => s.verification);

  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('All');
  const [page, setPage]               = useState(0); // MUI TablePagination is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [selected, setSelected]       = useState([]);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  const debouncedSearch = useDebounce(search, 350);

  // Fetch whenever page, rowsPerPage, type filter, or debounced search changes
  useEffect(() => {
    dispatch(fetchPendingVerifications({
      page: page + 1,
      limit: rowsPerPage,
      type: typeFilter !== 'All' ? typeFilter : undefined,
    }));
  }, [dispatch, page, rowsPerPage, typeFilter, debouncedSearch]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [typeFilter, debouncedSearch]);

  // Clear selection on page change
  useEffect(() => {
    setSelected([]);
  }, [pendingProperties]);

  const allSelected =
    pendingProperties.length > 0 && pendingProperties.every((p) => selected.includes(p._id));
  const someSelected = selected.length > 0;

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === pendingProperties.length ? [] : pendingProperties.map((p) => p._id)
    );
  }, [pendingProperties]);

  const toggleOne = useCallback((id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const handleReview = useCallback((id) => navigate(`/verification/${id}`), [navigate]);

  const handleBulkApprove = () => {
    dispatch(bulkVerificationAction({ propertyIds: selected, action: 'approve' }));
  };

  const handleBulkReject = () => {
    if (!bulkRejectReason.trim()) return;
    dispatch(bulkVerificationAction({ propertyIds: selected, action: 'reject', notes: bulkRejectReason }));
    setBulkRejectOpen(false);
    setBulkRejectReason('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Property Verification</Typography>
          <Typography color="text.secondary" mb={3}>Review and verify submitted properties.</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/register-property')}
        >
          Register Property
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by title or owner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 260, flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Property Type</InputLabel>
          <Select value={typeFilter} label="Property Type" onChange={(e) => setTypeFilter(e.target.value)}>
            {PROPERTY_TYPES.map((t) => (
              <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                {t === 'All' ? 'All Types' : t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Bulk toolbar */}
      {someSelected && (
        <Toolbar sx={{ mb: 1, px: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200', gap: 1 }}>
          <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1 }}>{selected.length} selected</Typography>
          <Tooltip title="Approve selected">
            <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />}
              onClick={handleBulkApprove} disabled={bulkLoading}>
              Bulk Approve
            </Button>
          </Tooltip>
          <Tooltip title="Reject selected">
            <Button size="small" variant="outlined" color="error" startIcon={<Cancel />}
              onClick={() => setBulkRejectOpen(true)} disabled={bulkLoading}>
              Bulk Reject
            </Button>
          </Tooltip>
          <Button size="small" onClick={() => setSelected([])}>Clear</Button>
        </Toolbar>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearActionError())}>{actionError}</Alert>
      )}
      {bulkResult && (
        <Alert
          severity={bulkResult.failed > 0 ? 'warning' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => dispatch(clearBulkResult())}
        >
          {bulkResult.message} — {bulkResult.processed} processed
          {bulkResult.failed > 0 ? `, ${bulkResult.failed} failed` : ''}
        </Alert>
      )}

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                    disabled={isLoading || pendingProperties.length === 0}
                  />
                </TableCell>
                {['Property Title', 'Owner', 'Type', 'Price', 'Submitted', 'Status', 'Action'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading &&
                Array.from({ length: rowsPerPage > 5 ? 5 : rowsPerPage }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading && pendingProperties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                      <Inbox sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                      <Typography variant="body1" fontWeight={500}>No pending properties</Typography>
                      <Typography variant="body2" mt={0.5}>All properties have been reviewed.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && pendingProperties.map((p) => (
                <PropertyRow
                  key={p._id}
                  p={p}
                  isChecked={selected.includes(p._id)}
                  onToggle={toggleOne}
                  onReview={handleReview}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={pagination.total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 15, 25, 50]}
        />
      </Paper>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectOpen} onClose={() => setBulkRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Reject {selected.length} Properties</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth multiline rows={3}
            label="Rejection Reason"
            value={bulkRejectReason}
            onChange={(e) => setBulkRejectReason(e.target.value)}
            required sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkRejectOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleBulkReject}
            disabled={!bulkRejectReason.trim() || bulkLoading}>
            Reject All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

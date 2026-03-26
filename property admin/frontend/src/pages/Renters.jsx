import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  MenuItem, Alert, TablePagination, InputAdornment, Skeleton, Avatar,
  List, ListItem, ListItemText, Divider,
} from '@mui/material';
import {
  Search, Visibility, Delete, PersonAdd, Phone, Email,
  Home, AttachMoney, CheckCircle,
} from '@mui/icons-material';
import { useDebounce } from '../utils/useDebounce.js';

const MOCK_RENTERS = [
  {
    _id: 'r1',
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    phone: '+251911111111',
    idNumber: 'ID111111',
    budget: 15000,
    preferredType: 'residential',
    preferredLocation: 'Kezira',
    rentalDuration: 'monthly',
    status: 'active',
    registeredDate: '2026-01-15T10:00:00Z',
    notes: 'Reliable tenant, always pays on time',
  },
  {
    _id: 'r2',
    name: 'Mohammed Ali',
    email: 'mohammed@example.com',
    phone: '+251922222222',
    idNumber: 'ID222222',
    budget: 25000,
    preferredType: 'commercial',
    preferredLocation: 'City Center',
    rentalDuration: 'yearly',
    status: 'active',
    registeredDate: '2025-11-20T14:30:00Z',
    notes: 'Business owner looking for office space',
  },
  {
    _id: 'r3',
    name: 'Hana Bekele',
    email: 'hana@example.com',
    phone: '+251933333333',
    idNumber: 'ID333333',
    budget: 8000,
    preferredType: 'residential',
    preferredLocation: 'Megala',
    rentalDuration: 'monthly',
    status: 'inactive',
    registeredDate: '2025-08-10T09:00:00Z',
    notes: 'Previous tenant, good record',
  },
];

const PROPERTY_TYPES = ['residential', 'commercial', 'land', 'industrial'];
const RENTAL_DURATIONS = ['monthly', 'quarterly', 'yearly'];
const RENTER_STATUS = ['active', 'inactive', 'blacklisted'];

const STATUS_CONFIG = {
  active: { color: 'success', label: 'Active' },
  inactive: { color: 'default', label: 'Inactive' },
  blacklisted: { color: 'error', label: 'Blacklisted' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtCurrency = (n) => n != null ? `ETB ${Number(n).toLocaleString()}` : '—';

export default function Renters() {
  const [renters, setRenters] = useState(MOCK_RENTERS);
  const [filteredRenters, setFilteredRenters] = useState(MOCK_RENTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    budget: '',
    preferredType: 'residential',
    preferredLocation: '',
    rentalDuration: 'monthly',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      let filtered = [...renters];
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter((r) => r.status === statusFilter);
      }
      
      if (typeFilter !== 'all') {
        filtered = filtered.filter((r) => r.preferredType === typeFilter);
      }
      
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter((r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.idNumber.toLowerCase().includes(q)
        );
      }
      
      setFilteredRenters(filtered);
      setIsLoading(false);
    }, 300);
  }, [renters, statusFilter, typeFilter, debouncedSearch]);

  useEffect(() => { setPage(0); }, [statusFilter, typeFilter, debouncedSearch]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.idNumber.trim()) errors.idNumber = 'ID number is required';
    if (!formData.budget || formData.budget <= 0) errors.budget = 'Valid budget is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRenter = () => {
    if (!validateForm()) return;

    const newRenter = {
      _id: `r${Date.now()}`,
      ...formData,
      budget: Number(formData.budget),
      status: 'active',
      registeredDate: new Date().toISOString(),
    };

    setRenters((prev) => [newRenter, ...prev]);
    setSuccessMsg(`Renter "${newRenter.name}" registered successfully!`);
    setAddDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      idNumber: '',
      budget: '',
      preferredType: 'residential',
      preferredLocation: '',
      rentalDuration: 'monthly',
      notes: '',
    });
  };

  const handleViewRenter = (renter) => {
    setSelectedRenter(renter);
    setViewDialogOpen(true);
  };

  const handleDeleteRenter = (renterId) => {
    if (confirm('Are you sure you want to delete this renter?')) {
      setRenters((prev) => prev.filter((r) => r._id !== renterId));
      setSuccessMsg('Renter deleted successfully');
    }
  };

  const activeRenters = renters.filter((r) => r.status === 'active').length;
  const totalBudget = renters.filter((r) => r.status === 'active').reduce((sum, r) => sum + (r.budget || 0), 0);

  const paginatedRenters = filteredRenters.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Renters</Typography>
          <Typography color="text.secondary">Manage property renters and rental preferences</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAddDialogOpen(true)}>
          Register Renter
        </Button>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50', color: 'primary.main', display: 'flex' }}>
                  <PersonAdd sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main">{renters.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Renters</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.50', color: 'success.main', display: 'flex' }}>
                  <CheckCircle sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="success.main">{activeRenters}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Renters</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.50', color: 'info.main', display: 'flex' }}>
                  <Home sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="info.main">{activeRenters}</Typography>
                  <Typography variant="body2" color="text.secondary">Looking for Rentals</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.50', color: 'warning.main', display: 'flex' }}>
                  <AttachMoney sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="warning.main">{fmtCurrency(totalBudget)}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Budget</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search by name, email, phone, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 280, flexGrow: 1 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
            />
            <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="all">All Status</MenuItem>
              {RENTER_STATUS.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Property Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="all">All Types</MenuItem>
              {PROPERTY_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Renter', 'Contact', 'Budget', 'Preferred Type', 'Duration', 'Location', 'Status', 'Registered', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 9 }).map((__, j) => <TableCell key={j}><Skeleton variant="text" /></TableCell>)}</TableRow>
              ))}
              {!isLoading && filteredRenters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                      <PersonAdd sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                      <Typography variant="body1" fontWeight={500}>No renters found</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && paginatedRenters.map((renter) => {
                const status = STATUS_CONFIG[renter.status];
                return (
                  <TableRow key={renter._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem' }}>{renter.name.charAt(0)}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{renter.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{renter.idNumber}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{renter.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{renter.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtCurrency(renter.budget)}/mo</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{renter.preferredType}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{renter.rentalDuration}</TableCell>
                    <TableCell>{renter.preferredLocation || '—'}</TableCell>
                    <TableCell><Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(renter.registeredDate)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary" onClick={() => handleViewRenter(renter)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDeleteRenter(renter._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredRenters.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Add Renter Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Register New Renter</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Number"
                placeholder="National ID or Passport"
                value={formData.idNumber}
                onChange={(e) => handleFormChange('idNumber', e.target.value)}
                error={!!formErrors.idNumber}
                helperText={formErrors.idNumber}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Budget (ETB)"
                type="number"
                value={formData.budget}
                onChange={(e) => handleFormChange('budget', e.target.value)}
                error={!!formErrors.budget}
                helperText={formErrors.budget}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Preferred Property Type"
                value={formData.preferredType}
                onChange={(e) => handleFormChange('preferredType', e.target.value)}
                required
              >
                {PROPERTY_TYPES.map((t) => (
                  <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preferred Location"
                placeholder="e.g., Kezira, City Center"
                value={formData.preferredLocation}
                onChange={(e) => handleFormChange('preferredLocation', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Rental Duration"
                value={formData.rentalDuration}
                onChange={(e) => handleFormChange('rentalDuration', e.target.value)}
                required
              >
                {RENTAL_DURATIONS.map((d) => (
                  <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                placeholder="Additional information about the renter…"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={handleAddRenter}>
            Register Renter
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Renter Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Renter Details</DialogTitle>
        <DialogContent>
          {selectedRenter && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: '1.5rem' }}>
                  {selectedRenter.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>{selectedRenter.name}</Typography>
                  <Chip label={STATUS_CONFIG[selectedRenter.status].label} color={STATUS_CONFIG[selectedRenter.status].color} size="small" />
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                <ListItem><ListItemText primary="ID Number" secondary={selectedRenter.idNumber} /></ListItem>
                <ListItem><ListItemText primary="Email" secondary={selectedRenter.email} /></ListItem>
                <ListItem><ListItemText primary="Phone" secondary={selectedRenter.phone} /></ListItem>
                <ListItem><ListItemText primary="Monthly Budget" secondary={fmtCurrency(selectedRenter.budget)} /></ListItem>
                <ListItem>
                  <ListItemText
                    primary="Preferred Type"
                    secondary={<span style={{ textTransform: 'capitalize' }}>{selectedRenter.preferredType}</span>}
                  />
                </ListItem>
                <ListItem><ListItemText primary="Preferred Location" secondary={selectedRenter.preferredLocation || '—'} /></ListItem>
                <ListItem>
                  <ListItemText
                    primary="Rental Duration"
                    secondary={<span style={{ textTransform: 'capitalize' }}>{selectedRenter.rentalDuration}</span>}
                  />
                </ListItem>
                <ListItem><ListItemText primary="Registered Date" secondary={fmtDate(selectedRenter.registeredDate)} /></ListItem>
                {selectedRenter.notes && (
                  <ListItem><ListItemText primary="Notes" secondary={selectedRenter.notes} /></ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

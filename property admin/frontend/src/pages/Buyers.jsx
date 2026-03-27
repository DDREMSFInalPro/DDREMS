import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  MenuItem, Alert, TablePagination, InputAdornment, Skeleton, Avatar,
  List, ListItem, ListItemText, Divider,
} from '@mui/material';
import {
  Add, Search, Edit, Visibility, Delete, PersonAdd, Phone, Email,
  Home, AttachMoney, CheckCircle, PendingActions,
} from '@mui/icons-material';
import { useDebounce } from '../utils/useDebounce.js';

// Mock buyers data
const MOCK_BUYERS = [
  {
    _id: 'b1',
    name: 'Ahmed Mohammed',
    email: 'ahmed.m@example.com',
    phone: '+251911234567',
    idNumber: 'DD-2024-001',
    budget: 5000000,
    preferredType: 'residential',
    preferredLocation: 'Kezira',
    status: 'active',
    registeredDate: '2026-03-15T10:00:00Z',
    interestedProperties: ['p1', 'p8'],
    notes: 'Looking for 3-4 bedroom villa',
  },
  {
    _id: 'b2',
    name: 'Sara Tesfaye',
    email: 'sara.t@example.com',
    phone: '+251922345678',
    idNumber: 'DD-2024-002',
    budget: 2500000,
    preferredType: 'residential',
    preferredLocation: 'Gendekore',
    status: 'active',
    registeredDate: '2026-03-16T14:30:00Z',
    interestedProperties: ['p4'],
    notes: 'First-time buyer, needs financing assistance',
  },
  {
    _id: 'b3',
    name: 'Bekele Industries',
    email: 'contact@bekele-ind.com',
    phone: '+251933456789',
    idNumber: 'DD-2024-003',
    budget: 15000000,
    preferredType: 'commercial',
    preferredLocation: 'City Center',
    status: 'active',
    registeredDate: '2026-03-17T09:00:00Z',
    interestedProperties: ['p7', 'p2'],
    notes: 'Corporate buyer, looking for office space',
  },
  {
    _id: 'b4',
    name: 'Hana Alemu',
    email: 'hana.a@example.com',
    phone: '+251944567890',
    idNumber: 'DD-2024-004',
    budget: 800000,
    preferredType: 'residential',
    preferredLocation: 'Addis Ketema',
    status: 'matched',
    registeredDate: '2026-03-10T11:00:00Z',
    interestedProperties: ['p6'],
    matchedProperty: 'p6',
    notes: 'Matched with studio apartment',
  },
  {
    _id: 'b5',
    name: 'Yohannes Bekele',
    email: 'yohannes.b@example.com',
    phone: '+251955678901',
    idNumber: 'DD-2024-005',
    budget: 12000000,
    preferredType: 'industrial',
    preferredLocation: 'Melka Jebdu',
    status: 'inactive',
    registeredDate: '2026-02-20T08:00:00Z',
    interestedProperties: [],
    notes: 'No longer looking',
  },
];

const PROPERTY_TYPES = ['residential', 'commercial', 'land', 'industrial'];
const BUYER_STATUS = ['active', 'matched', 'inactive'];

const STATUS_CONFIG = {
  active: { color: 'success', label: 'Active' },
  matched: { color: 'info', label: 'Matched' },
  inactive: { color: 'default', label: 'Inactive' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtCurrency = (n) => n != null ? `ETB ${Number(n).toLocaleString()}` : '—';

export default function Buyers() {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState(MOCK_BUYERS);
  const [filteredBuyers, setFilteredBuyers] = useState(MOCK_BUYERS);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    budget: '',
    preferredType: 'residential',
    preferredLocation: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      let filtered = [...buyers];
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter((b) => b.status === statusFilter);
      }
      
      if (typeFilter !== 'all') {
        filtered = filtered.filter((b) => b.preferredType === typeFilter);
      }
      
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter((b) =>
          b.name.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          b.idNumber.toLowerCase().includes(q)
        );
      }
      
      setFilteredBuyers(filtered);
      setIsLoading(false);
    }, 300);
  }, [buyers, statusFilter, typeFilter, debouncedSearch]);

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

  const handleAddBuyer = () => {
    if (!validateForm()) return;

    const newBuyer = {
      _id: `b${Date.now()}`,
      ...formData,
      budget: Number(formData.budget),
      status: 'active',
      registeredDate: new Date().toISOString(),
      interestedProperties: [],
    };

    setBuyers((prev) => [newBuyer, ...prev]);
    setSuccessMsg(`Buyer "${newBuyer.name}" registered successfully!`);
    setAddDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      idNumber: '',
      budget: '',
      preferredType: 'residential',
      preferredLocation: '',
      notes: '',
    });
  };

  const handleViewBuyer = (buyer) => {
    setSelectedBuyer(buyer);
    setViewDialogOpen(true);
  };

  const handleDeleteBuyer = (buyerId) => {
    if (confirm('Are you sure you want to delete this buyer?')) {
      setBuyers((prev) => prev.filter((b) => b._id !== buyerId));
      setSuccessMsg('Buyer deleted successfully');
    }
  };

  const activeBuyers = buyers.filter((b) => b.status === 'active').length;
  const matchedBuyers = buyers.filter((b) => b.status === 'matched').length;
  const totalBudget = buyers.reduce((sum, b) => sum + (b.budget || 0), 0);

  const paginatedBuyers = filteredBuyers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Property Buyers</Typography>
          <Typography color="text.secondary">Manage registered buyers and their preferences</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAddDialogOpen(true)}>
          Register Buyer
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
                  <Typography variant="h5" fontWeight={700} color="primary.main">{buyers.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Buyers</Typography>
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
                  <Typography variant="h5" fontWeight={700} color="success.main">{activeBuyers}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Buyers</Typography>
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
                  <Typography variant="h5" fontWeight={700} color="info.main">{matchedBuyers}</Typography>
                  <Typography variant="body2" color="text.secondary">Matched</Typography>
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
              {BUYER_STATUS.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
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
                {['Buyer', 'Contact', 'Budget', 'Preferred Type', 'Location', 'Status', 'Registered', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 8 }).map((__, j) => <TableCell key={j}><Skeleton variant="text" /></TableCell>)}</TableRow>
              ))}
              {!isLoading && filteredBuyers.length === 0 && (
                <TableRow><TableCell colSpan={8}><Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}><PersonAdd sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} /><Typography variant="body1" fontWeight={500}>No buyers found</Typography></Box></TableCell></TableRow>
              )}
              {!isLoading && paginatedBuyers.map((buyer) => {
                const status = STATUS_CONFIG[buyer.status];
                return (
                  <TableRow key={buyer._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem' }}>{buyer.name.charAt(0)}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{buyer.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{buyer.idNumber}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{buyer.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{buyer.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtCurrency(buyer.budget)}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{buyer.preferredType}</TableCell>
                    <TableCell>{buyer.preferredLocation || '—'}</TableCell>
                    <TableCell><Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(buyer.registeredDate)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details"><IconButton size="small" color="primary" onClick={() => handleViewBuyer(buyer)}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteBuyer(buyer._id)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filteredBuyers.length} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} />
      </Paper>

      {/* Add Buyer Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Register New Buyer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} error={!!formErrors.name} helperText={formErrors.name} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="ID Number" placeholder="National ID or Passport" value={formData.idNumber} onChange={(e) => handleFormChange('idNumber', e.target.value)} error={!!formErrors.idNumber} helperText={formErrors.idNumber} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)} error={!!formErrors.email} helperText={formErrors.email} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} error={!!formErrors.phone} helperText={formErrors.phone} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Budget (ETB)" type="number" value={formData.budget} onChange={(e) => handleFormChange('budget', e.target.value)} error={!!formErrors.budget} helperText={formErrors.budget} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Preferred Property Type" value={formData.preferredType} onChange={(e) => handleFormChange('preferredType', e.target.value)} required>
                {PROPERTY_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Preferred Location" placeholder="e.g., Kezira, City Center" value={formData.preferredLocation} onChange={(e) => handleFormChange('preferredLocation', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Notes" placeholder="Additional information about the buyer…" value={formData.notes} onChange={(e) => handleFormChange('notes', e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={handleAddBuyer}>Register Buyer</Button>
        </DialogActions>
      </Dialog>

      {/* View Buyer Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Buyer Details</DialogTitle>
        <DialogContent>
          {selectedBuyer && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: '1.5rem' }}>{selectedBuyer.name.charAt(0)}</Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>{selectedBuyer.name}</Typography>
                  <Chip label={STATUS_CONFIG[selectedBuyer.status].label} color={STATUS_CONFIG[selectedBuyer.status].color} size="small" />
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                <ListItem><ListItemText primary="ID Number" secondary={selectedBuyer.idNumber} /></ListItem>
                <ListItem><ListItemText primary="Email" secondary={selectedBuyer.email} /></ListItem>
                <ListItem><ListItemText primary="Phone" secondary={selectedBuyer.phone} /></ListItem>
                <ListItem><ListItemText primary="Budget" secondary={fmtCurrency(selectedBuyer.budget)} /></ListItem>
                <ListItem><ListItemText primary="Preferred Type" secondary={<span style={{ textTransform: 'capitalize' }}>{selectedBuyer.preferredType}</span>} /></ListItem>
                <ListItem><ListItemText primary="Preferred Location" secondary={selectedBuyer.preferredLocation || '—'} /></ListItem>
                <ListItem><ListItemText primary="Registered Date" secondary={fmtDate(selectedBuyer.registeredDate)} /></ListItem>
                <ListItem><ListItemText primary="Interested Properties" secondary={selectedBuyer.interestedProperties.length > 0 ? `${selectedBuyer.interestedProperties.length} properties` : 'None'} /></ListItem>
                {selectedBuyer.notes && <ListItem><ListItemText primary="Notes" secondary={selectedBuyer.notes} /></ListItem>}
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

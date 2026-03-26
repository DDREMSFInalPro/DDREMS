import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  MenuItem, Alert, TablePagination, InputAdornment, Skeleton, Avatar,
  List, ListItem, ListItemText, Divider, Tabs, Tab, Badge, ListItemIcon,
} from '@mui/material';
import {
  Search, Visibility, Delete, PersonAdd, Phone, Email,
  Home, VerifiedUser, PendingActions, Block, Upload, CloudUpload,
  Description, CheckCircle, Cancel, LocationOn, AttachMoney,
} from '@mui/icons-material';
import { useDebounce } from '../utils/useDebounce.js';

// Mock property owners data
const MOCK_OWNERS = [
  {
    _id: 'o1',
    name: 'Abebe Kebede',
    email: 'abebe.k@example.com',
    phone: '+251911111111',
    idNumber: 'ID-2024-001',
    address: 'Kezira, Dire Dawa',
    status: 'verified',
    registeredDate: '2026-01-15T10:00:00Z',
    propertiesCount: 3,
    totalValue: 8500000,
    notes: 'Reliable owner with multiple properties',
    properties: [
      {
        id: 'p1',
        title: 'Luxury Villa in Kezira',
        type: 'residential',
        price: 4500000,
        address: 'Kezira Main Road, Dire Dawa',
        size: 350,
        bedrooms: 4,
        bathrooms: 3,
        status: 'approved',
      },
      {
        id: 'p2',
        title: 'Modern Apartment',
        type: 'residential',
        price: 2000000,
        address: 'Kezira District, Dire Dawa',
        size: 120,
        bedrooms: 2,
        bathrooms: 2,
        status: 'approved',
      },
      {
        id: 'p3',
        title: 'Commercial Building',
        type: 'commercial',
        price: 2000000,
        address: 'City Center, Dire Dawa',
        size: 200,
        status: 'pending',
      },
    ],
    documents: [
      { id: 'd1', name: 'National ID', type: 'identification', status: 'verified', uploadDate: '2026-01-15T10:00:00Z', url: '#' },
      { id: 'd2', name: 'Proof of Address', type: 'address_proof', status: 'verified', uploadDate: '2026-01-15T10:30:00Z', url: '#' },
      { id: 'd3', name: 'Tax Certificate', type: 'tax_document', status: 'verified', uploadDate: '2026-01-15T11:00:00Z', url: '#' },
    ],
  },
  {
    _id: 'o2',
    name: 'Tigist Haile',
    email: 'tigist.h@example.com',
    phone: '+251922222222',
    idNumber: 'ID-2024-002',
    address: 'Gendekore, Dire Dawa',
    status: 'verified',
    registeredDate: '2026-02-10T14:30:00Z',
    propertiesCount: 1,
    totalValue: 3200000,
    notes: 'First-time property owner',
    properties: [
      {
        id: 'p4',
        title: 'Family House',
        type: 'residential',
        price: 3200000,
        address: 'Gendekore, Dire Dawa',
        size: 180,
        bedrooms: 3,
        bathrooms: 2,
        status: 'approved',
      },
    ],
    documents: [
      { id: 'd4', name: 'National ID', type: 'identification', status: 'verified', uploadDate: '2026-02-10T14:30:00Z', url: '#' },
      { id: 'd5', name: 'Property Deed', type: 'property_deed', status: 'verified', uploadDate: '2026-02-10T15:00:00Z', url: '#' },
    ],
  },
  {
    _id: 'o3',
    name: 'Mohammed Ali',
    email: 'mohammed.a@example.com',
    phone: '+251933333333',
    idNumber: 'ID-2024-003',
    address: 'City Center, Dire Dawa',
    status: 'pending',
    registeredDate: '2026-03-18T09:00:00Z',
    propertiesCount: 2,
    totalValue: 12000000,
    notes: 'Pending document verification',
    properties: [
      {
        id: 'p5',
        title: 'Office Complex',
        type: 'commercial',
        price: 8000000,
        address: 'City Center, Dire Dawa',
        size: 500,
        status: 'pending',
      },
      {
        id: 'p6',
        title: 'Retail Shop',
        type: 'commercial',
        price: 4000000,
        address: 'Market Area, Dire Dawa',
        size: 150,
        status: 'pending',
      },
    ],
    documents: [
      { id: 'd6', name: 'National ID', type: 'identification', status: 'pending', uploadDate: '2026-03-18T09:00:00Z', url: '#' },
      { id: 'd7', name: 'Business License', type: 'business_license', status: 'pending', uploadDate: '2026-03-18T09:30:00Z', url: '#' },
    ],
  },
  {
    _id: 'o4',
    name: 'Sara Tesfaye',
    email: 'sara.t@example.com',
    phone: '+251944444444',
    idNumber: 'ID-2024-004',
    address: 'Melka Jebdu, Dire Dawa',
    status: 'verified',
    registeredDate: '2026-02-25T11:00:00Z',
    propertiesCount: 1,
    totalValue: 950000,
    notes: 'Studio apartment owner',
    properties: [
      {
        id: 'p7',
        title: 'Studio Apartment',
        type: 'residential',
        price: 950000,
        address: 'Melka Jebdu, Dire Dawa',
        size: 45,
        bedrooms: 1,
        bathrooms: 1,
        status: 'approved',
      },
    ],
    documents: [
      { id: 'd8', name: 'National ID', type: 'identification', status: 'verified', uploadDate: '2026-02-25T11:00:00Z', url: '#' },
    ],
  },
  {
    _id: 'o5',
    name: 'Dawit Bekele',
    email: 'dawit.b@example.com',
    phone: '+251955555555',
    idNumber: 'ID-2024-005',
    address: 'Addis Ketema, Dire Dawa',
    status: 'suspended',
    registeredDate: '2026-01-05T08:00:00Z',
    propertiesCount: 0,
    totalValue: 0,
    notes: 'Account suspended due to incomplete documents',
    properties: [],
    documents: [
      { id: 'd9', name: 'National ID', type: 'identification', status: 'rejected', uploadDate: '2026-01-05T08:00:00Z', url: '#' },
    ],
  },
  {
    _id: 'o6',
    name: 'Hana Girma',
    email: 'hana.g@example.com',
    phone: '+251966666666',
    idNumber: 'ID-2024-006',
    address: 'Kezira, Dire Dawa',
    status: 'pending',
    registeredDate: '2026-03-20T15:00:00Z',
    propertiesCount: 1,
    totalValue: 4500000,
    notes: 'New registration, awaiting approval',
    properties: [
      {
        id: 'p8',
        title: 'Townhouse',
        type: 'residential',
        price: 4500000,
        address: 'Kezira Heights, Dire Dawa',
        size: 220,
        bedrooms: 3,
        bathrooms: 2,
        status: 'pending',
      },
    ],
    documents: [
      { id: 'd10', name: 'National ID', type: 'identification', status: 'pending', uploadDate: '2026-03-20T15:00:00Z', url: '#' },
    ],
  },
];

const OWNER_STATUS = ['verified', 'pending', 'suspended'];

const STATUS_CONFIG = {
  verified: { color: 'success', label: 'Verified', icon: <VerifiedUser fontSize="small" /> },
  pending: { color: 'warning', label: 'Pending', icon: <PendingActions fontSize="small" /> },
  suspended: { color: 'error', label: 'Suspended', icon: <Block fontSize="small" /> },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtCurrency = (n) => n != null ? `ETB ${Number(n).toLocaleString()}` : '—';

export default function PropertyOwners() {
  const [owners, setOwners] = useState(MOCK_OWNERS);
  const [filteredOwners, setFilteredOwners] = useState(MOCK_OWNERS);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [viewTab, setViewTab] = useState(0);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    address: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Document upload
  const [uploadData, setUploadData] = useState({
    documentType: 'identification',
    file: null,
    fileName: '',
  });

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      let filtered = [...owners];
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter((o) => o.status === statusFilter);
      }
      
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter((o) =>
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.idNumber.toLowerCase().includes(q) ||
          o.address.toLowerCase().includes(q)
        );
      }
      
      setFilteredOwners(filtered);
      setIsLoading(false);
    }, 300);
  }, [owners, statusFilter, debouncedSearch]);

  useEffect(() => { setPage(0); }, [statusFilter, debouncedSearch]);

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
    if (!formData.address.trim()) errors.address = 'Address is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddOwner = () => {
    if (!validateForm()) return;

    const newOwner = {
      _id: `o${Date.now()}`,
      ...formData,
      status: 'pending',
      registeredDate: new Date().toISOString(),
      propertiesCount: 0,
      totalValue: 0,
      properties: [],
      documents: [],
    };

    setOwners((prev) => [newOwner, ...prev]);
    setSuccessMsg(`Property owner "${newOwner.name}" registered successfully!`);
    setAddDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      idNumber: '',
      address: '',
      notes: '',
    });
  };

  const handleViewOwner = (owner) => {
    setSelectedOwner(owner);
    setViewTab(0);
    setViewDialogOpen(true);
  };

  const handleOpenUpload = (owner) => {
    setSelectedOwner(owner);
    setUploadDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData((prev) => ({ ...prev, file, fileName: file.name }));
    }
  };

  const handleUploadDocument = () => {
    if (!uploadData.file) {
      alert('Please select a file to upload');
      return;
    }

    const newDoc = {
      id: `d${Date.now()}`,
      name: uploadData.fileName,
      type: uploadData.documentType,
      status: 'pending',
      uploadDate: new Date().toISOString(),
      url: '#',
    };

    setOwners((prev) =>
      prev.map((o) =>
        o._id === selectedOwner._id
          ? { ...o, documents: [...(o.documents || []), newDoc] }
          : o
      )
    );

    setSuccessMsg('Document uploaded successfully!');
    setUploadDialogOpen(false);
    setUploadData({ documentType: 'identification', file: null, fileName: '' });
  };

  const handleVerifyDocument = (docId) => {
    setOwners((prev) =>
      prev.map((o) =>
        o._id === selectedOwner._id
          ? {
              ...o,
              documents: (o.documents || []).map((d) =>
                d.id === docId ? { ...d, status: 'verified' } : d
              ),
            }
          : o
      )
    );
    setSuccessMsg('Document verified successfully');
    const updated = owners.find((o) => o._id === selectedOwner._id);
    if (updated) setSelectedOwner(updated);
  };

  const handleRejectDocument = (docId) => {
    setOwners((prev) =>
      prev.map((o) =>
        o._id === selectedOwner._id
          ? {
              ...o,
              documents: (o.documents || []).map((d) =>
                d.id === docId ? { ...d, status: 'rejected' } : d
              ),
            }
          : o
      )
    );
    setSuccessMsg('Document rejected');
    const updated = owners.find((o) => o._id === selectedOwner._id);
    if (updated) setSelectedOwner(updated);
  };

  const handleDeleteOwner = (ownerId) => {
    if (confirm('Are you sure you want to delete this property owner?')) {
      setOwners((prev) => prev.filter((o) => o._id !== ownerId));
      setSuccessMsg('Property owner deleted successfully');
    }
  };

  const handleUpdateStatus = (ownerId, newStatus) => {
    setOwners((prev) =>
      prev.map((o) => (o._id === ownerId ? { ...o, status: newStatus } : o))
    );
    setSuccessMsg(`Owner status updated to ${newStatus}`);
    setViewDialogOpen(false);
  };

  const verifiedOwners = owners.filter((o) => o.status === 'verified').length;
  const pendingOwners = owners.filter((o) => o.status === 'pending').length;
  const totalProperties = owners.reduce((sum, o) => sum + (o.propertiesCount || 0), 0);

  const paginatedOwners = filteredOwners.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Property Owners</Typography>
          <Typography color="text.secondary">Manage registered property owners</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAddDialogOpen(true)}>
          Register Owner
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
                  <Typography variant="h5" fontWeight={700} color="primary.main">{owners.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Owners</Typography>
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
                  <VerifiedUser sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="success.main">{verifiedOwners}</Typography>
                  <Typography variant="body2" color="text.secondary">Verified</Typography>
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
                  <PendingActions sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="warning.main">{pendingOwners}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending</Typography>
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
                  <Typography variant="h5" fontWeight={700} color="info.main">{totalProperties}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Properties</Typography>
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
              placeholder="Search by name, email, phone, ID, or address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 320, flexGrow: 1 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
            />
            <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="all">All Status</MenuItem>
              {OWNER_STATUS.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
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
                {['Owner', 'Contact', 'Address', 'Properties', 'Status', 'Registered', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton variant="text" /></TableCell>)}</TableRow>
              ))}
              {!isLoading && filteredOwners.length === 0 && (
                <TableRow><TableCell colSpan={7}><Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}><PersonAdd sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} /><Typography variant="body1" fontWeight={500}>No property owners found</Typography></Box></TableCell></TableRow>
              )}
              {!isLoading && paginatedOwners.map((owner) => {
                const status = STATUS_CONFIG[owner.status];
                return (
                  <TableRow key={owner._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem' }}>{owner.name.charAt(0)}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{owner.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{owner.idNumber}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{owner.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{owner.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{owner.address}</TableCell>
                    <TableCell align="center">{owner.propertiesCount}</TableCell>
                    <TableCell><Chip label={status.label} color={status.color} size="small" icon={status.icon} sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(owner.registeredDate)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details"><IconButton size="small" color="primary" onClick={() => handleViewOwner(owner)}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Upload Document">
                          <IconButton size="small" color="info" onClick={() => handleOpenUpload(owner)}>
                            <Badge badgeContent={(owner.documents || []).filter(d => d.status === 'pending').length} color="warning">
                              <Upload fontSize="small" />
                            </Badge>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteOwner(owner._id)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filteredOwners.length} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} />
      </Paper>

      {/* Add Owner Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Register New Property Owner</DialogTitle>
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
            <Grid item xs={12}>
              <TextField fullWidth label="Address" placeholder="e.g., Kezira, Dire Dawa" value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} error={!!formErrors.address} helperText={formErrors.address} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Notes" placeholder="Additional information about the owner…" value={formData.notes} onChange={(e) => handleFormChange('notes', e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={handleAddOwner}>Register Owner</Button>
        </DialogActions>
      </Dialog>

      {/* View Owner Dialog with Tabs */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>{selectedOwner?.name.charAt(0)}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={600}>{selectedOwner?.name}</Typography>
              <Chip label={STATUS_CONFIG[selectedOwner?.status]?.label} color={STATUS_CONFIG[selectedOwner?.status]?.color} size="small" icon={STATUS_CONFIG[selectedOwner?.status]?.icon} />
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} sx={{ px: 3, pt: 1 }}>
          <Tab label="Owner Info" />
          <Tab label={`Properties (${selectedOwner?.properties?.length || 0})`} />
          <Tab label={`Documents (${selectedOwner?.documents?.length || 0})`} />
        </Tabs>
        <DialogContent sx={{ minHeight: 300 }}>
          {selectedOwner && (
            <>
              {/* Tab 0: Owner Info */}
              {viewTab === 0 && (
                <Box>
                  <List dense>
                    <ListItem><ListItemText primary="ID Number" secondary={selectedOwner.idNumber} /></ListItem>
                    <ListItem><ListItemText primary="Email" secondary={selectedOwner.email} /></ListItem>
                    <ListItem><ListItemText primary="Phone" secondary={selectedOwner.phone} /></ListItem>
                    <ListItem><ListItemText primary="Address" secondary={selectedOwner.address} /></ListItem>
                    <ListItem><ListItemText primary="Properties Count" secondary={selectedOwner.propertiesCount} /></ListItem>
                    <ListItem><ListItemText primary="Total Property Value" secondary={fmtCurrency(selectedOwner.totalValue)} /></ListItem>
                    <ListItem><ListItemText primary="Registered Date" secondary={fmtDate(selectedOwner.registeredDate)} /></ListItem>
                    {selectedOwner.notes && <ListItem><ListItemText primary="Notes" secondary={selectedOwner.notes} /></ListItem>}
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedOwner.status !== 'verified' && (
                      <Button variant="contained" color="success" size="small" onClick={() => handleUpdateStatus(selectedOwner._id, 'verified')}>
                        Verify Owner
                      </Button>
                    )}
                    {selectedOwner.status !== 'suspended' && (
                      <Button variant="outlined" color="error" size="small" onClick={() => handleUpdateStatus(selectedOwner._id, 'suspended')}>
                        Suspend Owner
                      </Button>
                    )}
                    {selectedOwner.status === 'suspended' && (
                      <Button variant="outlined" color="warning" size="small" onClick={() => handleUpdateStatus(selectedOwner._id, 'pending')}>
                        Reactivate
                      </Button>
                    )}
                  </Box>
                </Box>
              )}

              {/* Tab 1: Properties */}
              {viewTab === 1 && (
                <Box>
                  {(!selectedOwner.properties || selectedOwner.properties.length === 0) ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                      <Home sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                      <Typography>No properties registered</Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {selectedOwner.properties.map((prop) => (
                        <Grid item xs={12} key={prop.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>{prop.title}</Typography>
                                <Chip label={prop.status} color={prop.status === 'approved' ? 'success' : 'warning'} size="small" />
                              </Box>
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <Home fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{prop.type}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <AttachMoney fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">{fmtCurrency(prop.price)}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationOn fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">{prop.address}</Typography>
                                  </Box>
                                </Grid>
                                {prop.bedrooms && (
                                  <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">
                                      {prop.size} m² • {prop.bedrooms} bed • {prop.bathrooms} bath
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}

              {/* Tab 2: Documents */}
              {viewTab === 2 && (
                <Box>
                  {(!selectedOwner.documents || selectedOwner.documents.length === 0) ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                      <Description sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                      <Typography>No documents uploaded</Typography>
                    </Box>
                  ) : (
                    <List>
                      {selectedOwner.documents.map((doc) => {
                        const docStatusConfig = {
                          verified: { color: 'success', icon: <CheckCircle fontSize="small" /> },
                          pending: { color: 'warning', icon: <PendingActions fontSize="small" /> },
                          rejected: { color: 'error', icon: <Cancel fontSize="small" /> },
                        };
                        const docStatus = docStatusConfig[doc.status];
                        return (
                          <Box key={doc.id}>
                            <ListItem
                              secondaryAction={
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {doc.status === 'pending' && (
                                    <>
                                      <Tooltip title="Verify">
                                        <IconButton size="small" color="success" onClick={() => handleVerifyDocument(doc.id)}>
                                          <CheckCircle fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Reject">
                                        <IconButton size="small" color="error" onClick={() => handleRejectDocument(doc.id)}>
                                          <Cancel fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  )}
                                  <Tooltip title="View">
                                    <IconButton size="small" color="primary">
                                      <Visibility fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              }
                            >
                              <ListItemIcon>
                                <Description color="action" />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={500}>{doc.name}</Typography>
                                    <Chip label={doc.status} color={docStatus.color} size="small" icon={docStatus.icon} />
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {doc.type.replace(/_/g, ' ')} • Uploaded {fmtDate(doc.uploadDate)}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            <Divider />
                          </Box>
                        );
                      })}
                    </List>
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document for {selectedOwner?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Document Type"
                value={uploadData.documentType}
                onChange={(e) => setUploadData((prev) => ({ ...prev, documentType: e.target.value }))}
              >
                <MenuItem value="identification">National ID / Passport</MenuItem>
                <MenuItem value="address_proof">Proof of Address</MenuItem>
                <MenuItem value="property_deed">Property Deed</MenuItem>
                <MenuItem value="tax_document">Tax Certificate</MenuItem>
                <MenuItem value="business_license">Business License</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CloudUpload />}
                sx={{ py: 2, borderStyle: 'dashed' }}
              >
                {uploadData.fileName || 'Choose File to Upload'}
                <input type="file" hidden onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              </Button>
              {uploadData.fileName && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Selected: {uploadData.fileName}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
                Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Upload />} onClick={handleUploadDocument}>
            Upload Document
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

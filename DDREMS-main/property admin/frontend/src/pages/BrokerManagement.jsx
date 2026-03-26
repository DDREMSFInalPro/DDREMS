import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Alert, Avatar, Divider, List, ListItem, ListItemText, LinearProgress,
} from '@mui/material';
import {
  Person, Visibility, Block, CheckCircle, TrendingUp, Assignment,
  Phone, Email, LocationOn, Home, AttachMoney,
} from '@mui/icons-material';

const MOCK_BROKERS = [
  {
    id: 'br1',
    name: 'Abebe Real Estate',
    contactPerson: 'Abebe Kebede',
    email: 'abebe@realestate.com',
    phone: '+251911234567',
    licenseNumber: 'BRK-2024-001',
    location: 'Dire Dawa',
    status: 'active',
    joinedDate: '2025-01-15T10:00:00Z',
    totalListings: 12,
    activeListings: 8,
    completedDeals: 15,
    totalRevenue: 45000000,
    rating: 4.5,
    performanceScore: 92,
  },
  {
    id: 'br2',
    name: 'Prime Properties Agency',
    contactPerson: 'Sara Tesfaye',
    email: 'sara@primeproperties.com',
    phone: '+251922345678',
    licenseNumber: 'BRK-2024-002',
    location: 'Dire Dawa',
    status: 'active',
    joinedDate: '2025-02-20T14:30:00Z',
    totalListings: 8,
    activeListings: 6,
    completedDeals: 10,
    totalRevenue: 28000000,
    rating: 4.2,
    performanceScore: 85,
  },
  {
    id: 'br3',
    name: 'City Brokers Ltd',
    contactPerson: 'Bekele Alemu',
    email: 'bekele@citybrokers.com',
    phone: '+251933456789',
    licenseNumber: 'BRK-2024-003',
    location: 'Dire Dawa',
    status: 'suspended',
    joinedDate: '2024-11-10T09:00:00Z',
    totalListings: 5,
    activeListings: 0,
    completedDeals: 3,
    totalRevenue: 8500000,
    rating: 3.1,
    performanceScore: 45,
    suspensionReason: 'Multiple customer complaints',
  },
  {
    id: 'br4',
    name: 'Elite Property Services',
    contactPerson: 'Hana Mohammed',
    email: 'hana@eliteproperties.com',
    phone: '+251944567890',
    licenseNumber: 'BRK-2024-004',
    location: 'Dire Dawa',
    status: 'active',
    joinedDate: '2025-03-01T11:00:00Z',
    totalListings: 15,
    activeListings: 12,
    completedDeals: 20,
    totalRevenue: 62000000,
    rating: 4.8,
    performanceScore: 96,
  },
];

const STATUS_CONFIG = {
  active: { color: 'success', label: 'Active' },
  suspended: { color: 'error', label: 'Suspended' },
  inactive: { color: 'default', label: 'Inactive' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtCurrency = (n) => n != null ? `ETB ${Number(n).toLocaleString()}` : '—';

export default function BrokerManagement() {
  const [brokers, setBrokers] = useState(MOCK_BROKERS);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleViewDetails = (broker) => {
    setSelectedBroker(broker);
    setViewDialogOpen(true);
  };

  const handleSuspendClick = (broker) => {
    setSelectedBroker(broker);
    setSuspendDialogOpen(true);
  };

  const handleSuspend = () => {
    if (!suspensionReason.trim()) {
      alert('Please provide suspension reason');
      return;
    }
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === selectedBroker.id
          ? { ...b, status: 'suspended', suspensionReason, activeListings: 0 }
          : b
      )
    );
    setSuccessMsg(`Broker "${selectedBroker.name}" has been suspended`);
    setSuspendDialogOpen(false);
    setViewDialogOpen(false);
    setSuspensionReason('');
  };

  const handleActivate = (brokerId) => {
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === brokerId
          ? { ...b, status: 'active', suspensionReason: undefined }
          : b
      )
    );
    setSuccessMsg('Broker has been activated');
  };

  const activeBrokers = brokers.filter((b) => b.status === 'active').length;
  const totalListings = brokers.reduce((sum, b) => sum + b.totalListings, 0);
  const totalRevenue = brokers.reduce((sum, b) => sum + b.totalRevenue, 0);
  const avgPerformance = Math.round(brokers.reduce((sum, b) => sum + b.performanceScore, 0) / brokers.length);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Broker & Agent Management</Typography>
          <Typography color="text.secondary">Monitor broker activities and performance</Typography>
        </Box>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50', color: 'primary.main', display: 'flex' }}>
                  <Person sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main">{brokers.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Brokers</Typography>
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
                  <Typography variant="h5" fontWeight={700} color="success.main">{activeBrokers}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Brokers</Typography>
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
                  <Typography variant="h5" fontWeight={700} color="info.main">{totalListings}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Listings</Typography>
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
                  <Typography variant="h6" fontWeight={700} color="warning.main">{fmtCurrency(totalRevenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Brokers Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Broker', 'Contact', 'License', 'Listings', 'Deals', 'Performance', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {brokers.map((broker) => {
                const status = STATUS_CONFIG[broker.status];

                return (
                  <TableRow key={broker.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {broker.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{broker.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{broker.contactPerson}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{broker.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{broker.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{broker.licenseNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{broker.activeListings} / {broker.totalListings}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{broker.completedDeals}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 100 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={600}>{broker.performanceScore}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={broker.performanceScore}
                          color={broker.performanceScore >= 80 ? 'success' : broker.performanceScore >= 60 ? 'warning' : 'error'}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary" onClick={() => handleViewDetails(broker)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {broker.status === 'active' && (
                          <Tooltip title="Suspend">
                            <IconButton size="small" color="error" onClick={() => handleSuspendClick(broker)}>
                              <Block fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {broker.status === 'suspended' && (
                          <Tooltip title="Activate">
                            <IconButton size="small" color="success" onClick={() => handleActivate(broker.id)}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Broker Details</DialogTitle>
        <DialogContent>
          {selectedBroker && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: '1.5rem' }}>
                  {selectedBroker.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>{selectedBroker.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedBroker.contactPerson}</Typography>
                  <Chip label={STATUS_CONFIG[selectedBroker.status].label} color={STATUS_CONFIG[selectedBroker.status].color} size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Total Listings</Typography>
                      <Typography variant="h5" fontWeight={700}>{selectedBroker.totalListings}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Active Listings</Typography>
                      <Typography variant="h5" fontWeight={700} color="success.main">{selectedBroker.activeListings}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Completed Deals</Typography>
                      <Typography variant="h5" fontWeight={700} color="primary.main">{selectedBroker.completedDeals}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                      <Typography variant="h6" fontWeight={700} color="warning.main">{fmtCurrency(selectedBroker.totalRevenue)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Performance Score</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={selectedBroker.performanceScore}
                      color={selectedBroker.performanceScore >= 80 ? 'success' : selectedBroker.performanceScore >= 60 ? 'warning' : 'error'}
                      sx={{ height: 10, borderRadius: 1 }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>{selectedBroker.performanceScore}%</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemText primary="License Number" secondary={selectedBroker.licenseNumber} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Email"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email sx={{ fontSize: 14 }} />
                        {selectedBroker.email}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Phone"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone sx={{ fontSize: 14 }} />
                        {selectedBroker.phone}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Location"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn sx={{ fontSize: 14 }} />
                        {selectedBroker.location}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Joined Date" secondary={fmtDate(selectedBroker.joinedDate)} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Rating" secondary={`${selectedBroker.rating} / 5.0`} />
                </ListItem>
                {selectedBroker.suspensionReason && (
                  <ListItem>
                    <ListItemText
                      primary="Suspension Reason"
                      secondary={
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {selectedBroker.suspensionReason}
                        </Alert>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedBroker?.status === 'active' && (
            <Button color="error" startIcon={<Block />} onClick={() => { setViewDialogOpen(false); handleSuspendClick(selectedBroker); }}>
              Suspend Broker
            </Button>
          )}
          {selectedBroker?.status === 'suspended' && (
            <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => { handleActivate(selectedBroker.id); setViewDialogOpen(false); }}>
              Activate Broker
            </Button>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Suspend Broker</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            You are about to suspend "{selectedBroker?.name}". All active listings will be deactivated.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Suspension Reason"
            placeholder="Explain why this broker is being suspended..."
            value={suspensionReason}
            onChange={(e) => setSuspensionReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<Block />} onClick={handleSuspend}>
            Suspend Broker
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

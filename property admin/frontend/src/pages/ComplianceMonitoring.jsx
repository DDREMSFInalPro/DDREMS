import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Alert, Avatar, Divider, List, ListItem, ListItemText, LinearProgress,
} from '@mui/material';
import {
  CheckCircle, Cancel, Visibility, Warning, Gavel, Description,
  Home, Business, VerifiedUser,
} from '@mui/icons-material';

const MOCK_COMPLIANCE_ITEMS = [
  {
    id: 'c1',
    type: 'property_registration',
    propertyId: 'p1',
    propertyName: 'Luxury Villa in Kezira',
    requirement: 'Property Registration Certificate',
    status: 'compliant',
    lastChecked: '2026-03-21T10:00:00Z',
    expiryDate: '2027-03-21T10:00:00Z',
    notes: 'All documents verified and up to date',
  },
  {
    id: 'c2',
    type: 'tax_compliance',
    propertyId: 'p4',
    propertyName: 'Modern Apartment',
    requirement: 'Property Tax Clearance',
    status: 'non_compliant',
    lastChecked: '2026-03-20T14:30:00Z',
    expiryDate: '2026-02-15T00:00:00Z',
    notes: 'Tax clearance expired, owner notified',
    daysOverdue: 35,
  },
  {
    id: 'c3',
    type: 'building_permit',
    propertyId: 'p7',
    propertyName: 'Commercial Office',
    requirement: 'Building Occupancy Permit',
    status: 'pending_review',
    lastChecked: '2026-03-19T09:00:00Z',
    expiryDate: '2027-06-30T00:00:00Z',
    notes: 'Awaiting renewal documentation',
  },
  {
    id: 'c4',
    type: 'environmental',
    propertyId: 'p2',
    propertyName: 'Retail Shop',
    requirement: 'Environmental Impact Assessment',
    status: 'compliant',
    lastChecked: '2026-03-18T16:00:00Z',
    expiryDate: '2028-01-15T00:00:00Z',
    notes: 'Compliant with all environmental regulations',
  },
  {
    id: 'c5',
    type: 'safety_inspection',
    propertyId: 'p8',
    propertyName: 'Industrial Warehouse',
    requirement: 'Fire Safety Inspection',
    status: 'expiring_soon',
    lastChecked: '2026-03-15T11:00:00Z',
    expiryDate: '2026-04-10T00:00:00Z',
    notes: 'Expires in 19 days, renewal required',
    daysUntilExpiry: 19,
  },
];

const STATUS_CONFIG = {
  compliant: { color: 'success', label: 'Compliant' },
  non_compliant: { color: 'error', label: 'Non-Compliant' },
  pending_review: { color: 'warning', label: 'Pending Review' },
  expiring_soon: { color: 'warning', label: 'Expiring Soon' },
};

const TYPE_CONFIG = {
  property_registration: 'Property Registration',
  tax_compliance: 'Tax Compliance',
  building_permit: 'Building Permit',
  environmental: 'Environmental',
  safety_inspection: 'Safety Inspection',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function ComplianceMonitoring() {
  const [items, setItems] = useState(MOCK_COMPLIANCE_ITEMS);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const handleUpdateClick = (item) => {
    setSelectedItem(item);
    setUpdateNotes('');
    setUpdateDialogOpen(true);
  };

  const handleMarkCompliant = () => {
    if (!updateNotes.trim()) {
      alert('Please provide update notes');
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? { ...i, status: 'compliant', lastChecked: new Date().toISOString(), notes: updateNotes }
          : i
      )
    );
    setSuccessMsg(`Compliance status updated for "${selectedItem.propertyName}"`);
    setUpdateDialogOpen(false);
    setViewDialogOpen(false);
  };

  const compliantCount = items.filter((i) => i.status === 'compliant').length;
  const nonCompliantCount = items.filter((i) => i.status === 'non_compliant').length;
  const pendingCount = items.filter((i) => i.status === 'pending_review').length;
  const expiringCount = items.filter((i) => i.status === 'expiring_soon').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Compliance Monitoring</Typography>
          <Typography color="text.secondary">Ensure regulatory compliance across all properties</Typography>
        </Box>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {nonCompliantCount > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<Warning />}>
          <Typography variant="body2" fontWeight={600}>
            {nonCompliantCount} propert{nonCompliantCount > 1 ? 'ies are' : 'y is'} non-compliant and require immediate attention!
          </Typography>
        </Alert>
      )}

      {expiringCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            {expiringCount} compliance item{expiringCount > 1 ? 's are' : ' is'} expiring soon
          </Typography>
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50', color: 'primary.main', display: 'flex' }}>
                  <Gavel sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main">{items.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Items</Typography>
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
                  <Typography variant="h5" fontWeight={700} color="success.main">{compliantCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Compliant</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.50', color: 'error.main', display: 'flex' }}>
                  <Cancel sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="error.main">{nonCompliantCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Non-Compliant</Typography>
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
                  <Warning sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="warning.main">{expiringCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Expiring Soon</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Type', 'Property', 'Requirement', 'Status', 'Last Checked', 'Expiry Date', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const status = STATUS_CONFIG[item.status];

                return (
                  <TableRow key={item.id} hover sx={{ bgcolor: item.status === 'non_compliant' ? 'error.50' : 'inherit' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <Gavel fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{TYPE_CONFIG[item.type]}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{item.propertyName}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.propertyId}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.requirement}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600 }} />
                      {item.daysOverdue && (
                        <Typography variant="caption" color="error.main" display="block" sx={{ mt: 0.5 }}>
                          {item.daysOverdue} days overdue
                        </Typography>
                      )}
                      {item.daysUntilExpiry && (
                        <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
                          {item.daysUntilExpiry} days until expiry
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(item.lastChecked)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(item.expiryDate)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary" onClick={() => handleViewDetails(item)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {item.status !== 'compliant' && (
                          <Tooltip title="Update Status">
                            <IconButton size="small" color="success" onClick={() => handleUpdateClick(item)}>
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
        <DialogTitle>Compliance Details</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Alert severity={STATUS_CONFIG[selectedItem.status].color} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600}>{selectedItem.requirement}</Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Compliance Type</Typography>
                      <Typography variant="body1" fontWeight={600}>{TYPE_CONFIG[selectedItem.type]}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Chip label={STATUS_CONFIG[selectedItem.status].label} color={STATUS_CONFIG[selectedItem.status].color} size="small" sx={{ mt: 0.5 }} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Property Information</Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.propertyName}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {selectedItem.propertyId}</Typography>
                  </CardContent>
                </Card>
              </Box>

              <List dense>
                <ListItem><ListItemText primary="Requirement" secondary={selectedItem.requirement} /></ListItem>
                <ListItem><ListItemText primary="Last Checked" secondary={fmtDate(selectedItem.lastChecked)} /></ListItem>
                <ListItem><ListItemText primary="Expiry Date" secondary={fmtDate(selectedItem.expiryDate)} /></ListItem>
                {selectedItem.daysOverdue && (
                  <ListItem>
                    <ListItemText
                      primary="Days Overdue"
                      secondary={
                        <Chip label={`${selectedItem.daysOverdue} days`} color="error" size="small" />
                      }
                    />
                  </ListItem>
                )}
                {selectedItem.daysUntilExpiry && (
                  <ListItem>
                    <ListItemText
                      primary="Days Until Expiry"
                      secondary={
                        <Chip label={`${selectedItem.daysUntilExpiry} days`} color="warning" size="small" />
                      }
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="Notes"
                    secondary={
                      <Alert severity="info" sx={{ mt: 1 }}>
                        {selectedItem.notes}
                      </Alert>
                    }
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedItem?.status !== 'compliant' && (
            <Button variant="contained" startIcon={<CheckCircle />} onClick={() => { setViewDialogOpen(false); handleUpdateClick(selectedItem); }}>
              Update Status
            </Button>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Compliance Status</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Mark "{selectedItem?.requirement}" as compliant for "{selectedItem?.propertyName}"
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Update Notes"
            placeholder="Describe the compliance verification or updates made..."
            value={updateNotes}
            onChange={(e) => setUpdateNotes(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={handleMarkCompliant}>
            Mark as Compliant
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

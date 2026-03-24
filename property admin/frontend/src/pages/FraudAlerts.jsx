import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Alert, Avatar, Divider, List, ListItem, ListItemText,
} from '@mui/material';
import {
  Warning, CheckCircle, Cancel, Visibility, ReportProblem, Security,
  Person, Home, Description,
} from '@mui/icons-material';

const MOCK_ALERTS = [
  {
    id: 'fa1',
    type: 'duplicate_listing',
    severity: 'high',
    propertyId: 'p1',
    propertyName: 'Luxury Villa in Kezira',
    description: 'Property listed multiple times with different prices',
    details: 'Same property found listed at ETB 8.5M and ETB 9.2M by different agents',
    detectedDate: '2026-03-21T10:00:00Z',
    status: 'pending',
    affectedParties: ['Agent A', 'Agent B'],
  },
  {
    id: 'fa2',
    type: 'document_forgery',
    severity: 'critical',
    propertyId: 'p4',
    propertyName: 'Modern Apartment',
    description: 'Suspicious document detected',
    details: 'Property deed shows signs of digital manipulation',
    detectedDate: '2026-03-20T14:30:00Z',
    status: 'pending',
    affectedParties: ['Owner: Ahmed Mohammed'],
  },
  {
    id: 'fa3',
    type: 'identity_mismatch',
    severity: 'high',
    propertyId: 'p7',
    propertyName: 'Commercial Office',
    description: 'Owner identity verification failed',
    details: 'ID document name does not match property deed owner name',
    detectedDate: '2026-03-19T09:00:00Z',
    status: 'resolved',
    affectedParties: ['Owner: Sara Tesfaye'],
    resolvedBy: 'Admin User',
    resolvedDate: '2026-03-20T11:00:00Z',
    resolution: 'Verified with additional documents - name change after marriage',
  },
  {
    id: 'fa4',
    type: 'price_manipulation',
    severity: 'medium',
    propertyId: 'p2',
    propertyName: 'Retail Shop',
    description: 'Unusual price fluctuation',
    details: 'Price changed 3 times in 24 hours',
    detectedDate: '2026-03-18T16:00:00Z',
    status: 'dismissed',
    affectedParties: ['Agent: Bekele Industries'],
    dismissedBy: 'Admin User',
    dismissedDate: '2026-03-19T10:00:00Z',
    dismissalReason: 'Owner testing market response',
  },
];

const SEVERITY_CONFIG = {
  critical: { color: 'error', label: 'Critical', icon: <ReportProblem /> },
  high: { color: 'warning', label: 'High', icon: <Warning /> },
  medium: { color: 'info', label: 'Medium', icon: <Security /> },
  low: { color: 'default', label: 'Low', icon: <Security /> },
};

const STATUS_CONFIG = {
  pending: { color: 'warning', label: 'Pending' },
  resolved: { color: 'success', label: 'Resolved' },
  dismissed: { color: 'default', label: 'Dismissed' },
};

const ALERT_TYPES = {
  duplicate_listing: 'Duplicate Listing',
  document_forgery: 'Document Forgery',
  identity_mismatch: 'Identity Mismatch',
  price_manipulation: 'Price Manipulation',
  fake_documents: 'Fake Documents',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [dismissalReason, setDismissalReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleViewDetails = (alert) => {
    setSelectedAlert(alert);
    setViewDialogOpen(true);
  };

  const handleResolveClick = (alert) => {
    setSelectedAlert(alert);
    setResolveDialogOpen(true);
  };

  const handleDismissClick = (alert) => {
    setSelectedAlert(alert);
    setDismissDialogOpen(true);
  };

  const handleResolve = () => {
    if (!resolution.trim()) {
      alert('Please provide resolution details');
      return;
    }
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === selectedAlert.id
          ? { ...a, status: 'resolved', resolvedBy: 'Admin User', resolvedDate: new Date().toISOString(), resolution }
          : a
      )
    );
    setSuccessMsg(`Alert "${selectedAlert.description}" marked as resolved`);
    setResolveDialogOpen(false);
    setViewDialogOpen(false);
    setResolution('');
  };

  const handleDismiss = () => {
    if (!dismissalReason.trim()) {
      alert('Please provide dismissal reason');
      return;
    }
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === selectedAlert.id
          ? { ...a, status: 'dismissed', dismissedBy: 'Admin User', dismissedDate: new Date().toISOString(), dismissalReason }
          : a
      )
    );
    setSuccessMsg(`Alert "${selectedAlert.description}" dismissed`);
    setDismissDialogOpen(false);
    setViewDialogOpen(false);
    setDismissalReason('');
  };

  const pendingCount = alerts.filter((a) => a.status === 'pending').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status === 'pending').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Fraud Detection & Alerts</Typography>
          <Typography color="text.secondary">Monitor and manage fraud alerts and suspicious activities</Typography>
        </Box>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {criticalCount > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<ReportProblem />}>
          <Typography variant="body2" fontWeight={600}>
            {criticalCount} critical alert{criticalCount > 1 ? 's' : ''} require immediate attention!
          </Typography>
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.50', color: 'error.main', display: 'flex' }}>
                  <Warning sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="error.main">{alerts.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Alerts</Typography>
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
                  <ReportProblem sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="warning.main">{pendingCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending Review</Typography>
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
                  <Security sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="error.main">{criticalCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Critical</Typography>
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
                  <Typography variant="h5" fontWeight={700} color="success.main">{resolvedCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Resolved</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Alert Type', 'Property', 'Description', 'Severity', 'Detected', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => {
                const severity = SEVERITY_CONFIG[alert.severity];
                const status = STATUS_CONFIG[alert.status];

                return (
                  <TableRow key={alert.id} hover sx={{ bgcolor: alert.severity === 'critical' && alert.status === 'pending' ? 'error.50' : 'inherit' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: `${severity.color}.main`, width: 32, height: 32 }}>
                          {severity.icon}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{ALERT_TYPES[alert.type]}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{alert.propertyName}</Typography>
                        <Typography variant="caption" color="text.secondary">{alert.propertyId}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{alert.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={severity.label} color={severity.color} size="small" icon={severity.icon} sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(alert.detectedDate)}</TableCell>
                    <TableCell><Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary" onClick={() => handleViewDetails(alert)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {alert.status === 'pending' && (
                          <>
                            <Tooltip title="Resolve">
                              <IconButton size="small" color="success" onClick={() => handleResolveClick(alert)}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Dismiss">
                              <IconButton size="small" color="default" onClick={() => handleDismissClick(alert)}>
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
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
        <DialogTitle>Fraud Alert Details</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Alert severity={SEVERITY_CONFIG[selectedAlert.severity].color} sx={{ mb: 2 }} icon={SEVERITY_CONFIG[selectedAlert.severity].icon}>
                <Typography variant="body2" fontWeight={600}>{selectedAlert.description}</Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Alert Type</Typography>
                      <Typography variant="body1" fontWeight={600}>{ALERT_TYPES[selectedAlert.type]}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Severity</Typography>
                      <Chip label={SEVERITY_CONFIG[selectedAlert.severity].label} color={SEVERITY_CONFIG[selectedAlert.severity].color} size="small" sx={{ mt: 0.5 }} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Property Information</Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" fontWeight={600}>{selectedAlert.propertyName}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {selectedAlert.propertyId}</Typography>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Alert Details</Typography>
                <Alert severity="info">
                  <Typography variant="body2">{selectedAlert.details}</Typography>
                </Alert>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Affected Parties</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedAlert.affectedParties.map((party, idx) => (
                    <Chip key={idx} label={party} size="small" icon={<Person />} />
                  ))}
                </Box>
              </Box>

              <List dense>
                <ListItem><ListItemText primary="Detected Date" secondary={fmtDate(selectedAlert.detectedDate)} /></ListItem>
                <ListItem><ListItemText primary="Status" secondary={<Chip label={STATUS_CONFIG[selectedAlert.status].label} color={STATUS_CONFIG[selectedAlert.status].color} size="small" />} /></ListItem>
                {selectedAlert.resolvedBy && (
                  <>
                    <ListItem><ListItemText primary="Resolved By" secondary={selectedAlert.resolvedBy} /></ListItem>
                    <ListItem><ListItemText primary="Resolved Date" secondary={fmtDate(selectedAlert.resolvedDate)} /></ListItem>
                    <ListItem><ListItemText primary="Resolution" secondary={selectedAlert.resolution} /></ListItem>
                  </>
                )}
                {selectedAlert.dismissedBy && (
                  <>
                    <ListItem><ListItemText primary="Dismissed By" secondary={selectedAlert.dismissedBy} /></ListItem>
                    <ListItem><ListItemText primary="Dismissed Date" secondary={fmtDate(selectedAlert.dismissedDate)} /></ListItem>
                    <ListItem><ListItemText primary="Dismissal Reason" secondary={selectedAlert.dismissalReason} /></ListItem>
                  </>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedAlert?.status === 'pending' && (
            <>
              <Button color="default" startIcon={<Cancel />} onClick={() => { setViewDialogOpen(false); handleDismissClick(selectedAlert); }}>
                Dismiss
              </Button>
              <Button variant="contained" startIcon={<CheckCircle />} onClick={() => { setViewDialogOpen(false); handleResolveClick(selectedAlert); }}>
                Resolve
              </Button>
            </>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Fraud Alert</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            You are about to mark this alert as resolved: "{selectedAlert?.description}"
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Resolution Details"
            placeholder="Describe how this alert was resolved..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={handleResolve}>
            Mark as Resolved
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dismiss Dialog */}
      <Dialog open={dismissDialogOpen} onClose={() => setDismissDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dismiss Fraud Alert</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are about to dismiss this alert: "{selectedAlert?.description}"
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Dismissal Reason"
            placeholder="Explain why this alert is being dismissed..."
            value={dismissalReason}
            onChange={(e) => setDismissalReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDismissDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="default" startIcon={<Cancel />} onClick={handleDismiss}>
            Dismiss Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Alert, Avatar, Divider, List, ListItem, ListItemText, MenuItem, Tabs, Tab,
} from '@mui/material';
import {
  CheckCircle, Cancel, Visibility, PersonAdd, Person, Home,
  Email, Phone, AttachMoney, PendingActions,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_CONFIG = {
  pending: { color: 'warning', label: 'Pending' },
  approved: { color: 'success', label: 'Approved' },
  rejected: { color: 'error', label: 'Rejected' },
};

const TYPE_CONFIG = {
  owner: { label: 'Property Owner', icon: <Home />, color: 'primary' },
  buyer: { label: 'Buyer', icon: <PersonAdd />, color: 'info' },
  renter: { label: 'Renter', icon: <Person />, color: 'success' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtCurrency = (n) => n != null ? `ETB ${Number(n).toLocaleString()}` : '—';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0=all, 1=pending, 2=approved, 3=rejected

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, tabValue]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/requests`);
      setRequests(response.data);
    } catch (error) {
      setErrorMsg('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];
    if (tabValue === 1) filtered = filtered.filter(r => r.status === 'pending');
    if (tabValue === 2) filtered = filtered.filter(r => r.status === 'approved');
    if (tabValue === 3) filtered = filtered.filter(r => r.status === 'rejected');
    setFilteredRequests(filtered);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleApprove = async (requestId) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/requests/${requestId}/approve`, {
        approvedBy: 'Admin User'
      });
      setSuccessMsg('Request approved successfully');
      fetchRequests();
      setViewDialogOpen(false);
    } catch (error) {
      setErrorMsg('Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post(`${API_URL}/requests/${selectedRequest._id}/reject`, {
        reason: rejectionReason,
        rejectedBy: 'Admin User'
      });
      setSuccessMsg('Request rejected');
      setRejectionReason('');
      fetchRequests();
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
    } catch (error) {
      setErrorMsg('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Registration Requests</Typography>
          <Typography color="text.secondary">Review and approve owner, buyer, and renter requests</Typography>
        </Box>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

      {pendingCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<PendingActions />}>
          <Typography variant="body2" fontWeight={600}>
            {pendingCount} pending request{pendingCount > 1 ? 's' : ''} awaiting review
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
                  <PersonAdd sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main">{requests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Requests</Typography>
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
                  <Typography variant="h5" fontWeight={700} color="warning.main">{pendingCount}</Typography>
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
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.50', color: 'success.main', display: 'flex' }}>
                  <CheckCircle sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} color="success.main">{approvedCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Approved</Typography>
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
                  <Typography variant="h5" fontWeight={700} color="error.main">{rejectedCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Rejected</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`All (${requests.length})`} />
          <Tab label={`Pending (${pendingCount})`} />
          <Tab label={`Approved (${approvedCount})`} />
          <Tab label={`Rejected (${rejectedCount})`} />
        </Tabs>
      </Card>

      {/* Requests Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Type', 'Name', 'Contact', 'Details', 'Submitted', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                      <PersonAdd sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                      <Typography variant="body1" fontWeight={500}>No requests found</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {filteredRequests.map((request) => {
                const status = STATUS_CONFIG[request.status];
                const type = TYPE_CONFIG[request.type];

                return (
                  <TableRow key={request._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: `${type.color}.main`, width: 32, height: 32 }}>
                          {type.icon}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{type.label}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{request.data.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{request.data.idNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{request.data.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{request.data.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {request.type === 'owner' && (
                        <Typography variant="caption">{request.data.propertyCount || 0} properties</Typography>
                      )}
                      {request.type === 'buyer' && (
                        <Typography variant="caption">{fmtCurrency(request.data.budget)}</Typography>
                      )}
                      {request.type === 'renter' && (
                        <Typography variant="caption">{fmtCurrency(request.data.budget)}/month</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(request.submittedDate)}</TableCell>
                    <TableCell><Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary" onClick={() => handleViewDetails(request)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton size="small" color="success" onClick={() => handleApprove(request._id)}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" color="error" onClick={() => handleRejectClick(request)}>
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
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Alert severity={STATUS_CONFIG[selectedRequest.status].color} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  {TYPE_CONFIG[selectedRequest.type].label} Registration Request
                </Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Request Type</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {TYPE_CONFIG[selectedRequest.type].icon}
                        <Typography variant="body1" fontWeight={600}>{TYPE_CONFIG[selectedRequest.type].label}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Chip label={STATUS_CONFIG[selectedRequest.status].label} color={STATUS_CONFIG[selectedRequest.status].color} size="small" sx={{ mt: 0.5 }} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Applicant Information</Typography>
              <List dense>
                <ListItem><ListItemText primary="Full Name" secondary={selectedRequest.data.name} /></ListItem>
                <ListItem><ListItemText primary="ID Number" secondary={selectedRequest.data.idNumber} /></ListItem>
                <ListItem><ListItemText primary="Email" secondary={selectedRequest.data.email} /></ListItem>
                <ListItem><ListItemText primary="Phone" secondary={selectedRequest.data.phone} /></ListItem>
                
                {selectedRequest.type === 'owner' && (
                  <>
                    <ListItem><ListItemText primary="Address" secondary={selectedRequest.data.address} /></ListItem>
                    <ListItem><ListItemText primary="Number of Properties" secondary={selectedRequest.data.propertyCount || 0} /></ListItem>
                  </>
                )}
                
                {selectedRequest.type === 'buyer' && (
                  <>
                    <ListItem><ListItemText primary="Budget" secondary={fmtCurrency(selectedRequest.data.budget)} /></ListItem>
                    <ListItem><ListItemText primary="Preferred Type" secondary={<span style={{ textTransform: 'capitalize' }}>{selectedRequest.data.preferredType}</span>} /></ListItem>
                    <ListItem><ListItemText primary="Preferred Location" secondary={selectedRequest.data.preferredLocation || '—'} /></ListItem>
                  </>
                )}
                
                {selectedRequest.type === 'renter' && (
                  <>
                    <ListItem><ListItemText primary="Monthly Budget" secondary={fmtCurrency(selectedRequest.data.budget)} /></ListItem>
                    <ListItem><ListItemText primary="Preferred Type" secondary={<span style={{ textTransform: 'capitalize' }}>{selectedRequest.data.preferredType}</span>} /></ListItem>
                    <ListItem><ListItemText primary="Preferred Location" secondary={selectedRequest.data.preferredLocation || '—'} /></ListItem>
                    <ListItem><ListItemText primary="Rental Duration" secondary={<span style={{ textTransform: 'capitalize' }}>{selectedRequest.data.rentalDuration}</span>} /></ListItem>
                  </>
                )}
                
                {selectedRequest.data.notes && (
                  <ListItem>
                    <ListItemText
                      primary="Notes"
                      secondary={
                        <Alert severity="info" sx={{ mt: 1 }}>
                          {selectedRequest.data.notes}
                        </Alert>
                      }
                    />
                  </ListItem>
                )}
                
                <ListItem><ListItemText primary="Submitted Date" secondary={fmtDate(selectedRequest.submittedDate)} /></ListItem>
                
                {selectedRequest.approvedDate && (
                  <>
                    <ListItem><ListItemText primary="Approved Date" secondary={fmtDate(selectedRequest.approvedDate)} /></ListItem>
                    <ListItem><ListItemText primary="Approved By" secondary={selectedRequest.approvedBy} /></ListItem>
                  </>
                )}
                
                {selectedRequest.rejectedDate && (
                  <>
                    <ListItem><ListItemText primary="Rejected Date" secondary={fmtDate(selectedRequest.rejectedDate)} /></ListItem>
                    <ListItem><ListItemText primary="Rejected By" secondary={selectedRequest.rejectedBy} /></ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Rejection Reason"
                        secondary={
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {selectedRequest.rejectionReason}
                          </Alert>
                        }
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedRequest?.status === 'pending' && (
            <>
              <Button color="error" startIcon={<Cancel />} onClick={() => { setViewDialogOpen(false); handleRejectClick(selectedRequest); }}>
                Reject
              </Button>
              <Button variant="contained" startIcon={<CheckCircle />} onClick={() => handleApprove(selectedRequest._id)} disabled={loading}>
                Approve
              </Button>
            </>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are about to reject the registration request from "{selectedRequest?.data.name}"
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            placeholder="Explain why this request is being rejected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<Cancel />} onClick={handleReject} disabled={loading}>
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

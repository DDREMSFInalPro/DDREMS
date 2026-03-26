import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Stepper, Step, StepLabel, TextField,
  Button, Grid, MenuItem, Alert, Divider, IconButton, List, ListItem,
  ListItemText, Paper, Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar, Tooltip, Badge,
} from '@mui/material';
import {
  ArrowBack, ArrowForward, Save, Person, Home, Description,
  Delete, Upload, CheckCircle, Visibility, Edit, VerifiedUser, PendingActions,
  Cancel, CloudUpload,
} from '@mui/icons-material';

const PROPERTY_TYPES = ['residential', 'commercial', 'land', 'industrial'];
const LISTING_TYPES = ['sale', 'rent'];

const REQUIRED_DOCS = {
  residential: ['title_deed', 'id_card'],
  commercial: ['title_deed', 'business_license', 'tax_clearance'],
  land: ['title_deed', 'survey_map'],
  industrial: ['title_deed', 'building_permit', 'environmental_clearance'],
};

const formatDocType = (type) => type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function RegisterProperty() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState({});
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewTab, setViewTab] = useState(0);
  const [selectedOwner, setSelectedOwner] = useState(null);

  // Form data
  const [propertyData, setPropertyData] = useState({
    title: '',
    type: 'residential',
    listingType: 'sale',
    price: '',
    bedrooms: '',
    bathrooms: '',
    size: '',
    description: '',
    street: '',
    city: 'Dire Dawa',
    state: 'Dire Dawa',
    country: 'Ethiopia',
  });

  const [ownerData, setOwnerData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    status: 'pending',
    registeredDate: new Date().toISOString(),
    properties: [],
    documents: [],
  });

  const [documents, setDocuments] = useState([]);

  const steps = ['Property Details', 'Owner Information', 'Upload Documents'];

  const handlePropertyChange = (field, value) => {
    setPropertyData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleOwnerChange = (field, value) => {
    setOwnerData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newDocs = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: '', // User will select type
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const handleDocTypeChange = (docId, type) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, type } : doc))
    );
  };

  const handleRemoveDoc = (docId) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!propertyData.title.trim()) newErrors.title = 'Property title is required';
      if (!propertyData.price || propertyData.price <= 0) newErrors.price = 'Valid price is required';
      if (!propertyData.street.trim()) newErrors.street = 'Street address is required';
      if (propertyData.type === 'residential' && !propertyData.bedrooms) newErrors.bedrooms = 'Bedrooms required for residential';
    }

    if (step === 1) {
      if (!ownerData.name.trim()) newErrors.name = 'Owner name is required';
      if (!ownerData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerData.email)) newErrors.email = 'Invalid email format';
      if (!ownerData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!ownerData.idNumber.trim()) newErrors.idNumber = 'ID number is required';
    }

    if (step === 2) {
      const required = REQUIRED_DOCS[propertyData.type] || [];
      const uploaded = documents.filter((d) => d.type).map((d) => d.type);
      const missing = required.filter((r) => !uploaded.includes(r));
      if (missing.length > 0) {
        newErrors.documents = `Missing required documents: ${missing.map(formatDocType).join(', ')}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));

    // Create property object with owner and documents
    const newProperty = {
      id: `prop${Date.now()}`,
      ...propertyData,
      price: Number(propertyData.price),
      bedrooms: Number(propertyData.bedrooms) || 0,
      bathrooms: Number(propertyData.bathrooms) || 0,
      size: Number(propertyData.size) || 0,
      status: 'pending',
      createdDate: new Date().toISOString(),
    };

    // Add property to owner's properties list
    const updatedOwner = {
      ...ownerData,
      properties: [...(ownerData.properties || []), newProperty],
      documents: documents.map((doc) => ({
        id: `doc${Date.now()}${Math.random()}`,
        name: doc.name,
        type: doc.type,
        status: 'pending',
        uploadDate: new Date().toISOString(),
        url: '#',
      })),
    };

    setSelectedOwner(updatedOwner);
    setSuccessMsg('Property registered successfully! The property has been added to the verification queue.');
    setLoading(false);

    setTimeout(() => {
      navigate('/verification');
    }, 2000);
  };

  const requiredDocs = REQUIRED_DOCS[propertyData.type] || [];
  const uploadedTypes = documents.filter((d) => d.type).map((d) => d.type);
  const missingDocs = requiredDocs.filter((r) => !uploadedTypes.includes(r));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/verification')}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={700}>Register New Property</Typography>
          <Typography color="text.secondary">
            Manually register property for walk-in owners
          </Typography>
        </Box>
      </Box>

      {successMsg && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
          {successMsg}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 0: Property Details */}
          {activeStep === 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Home color="primary" />
                <Typography variant="h6">Property Information</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Property Title"
                    placeholder="e.g., Modern Villa in Kezira"
                    value={propertyData.title}
                    onChange={(e) => handlePropertyChange('title', e.target.value)}
                    error={!!errors.title}
                    helperText={errors.title}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Property Type"
                    value={propertyData.type}
                    onChange={(e) => handlePropertyChange('type', e.target.value)}
                    required
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <MenuItem key={type} value={type} sx={{ textTransform: 'capitalize' }}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Listing Type"
                    value={propertyData.listingType}
                    onChange={(e) => handlePropertyChange('listingType', e.target.value)}
                    required
                  >
                    {LISTING_TYPES.map((type) => (
                      <MenuItem key={type} value={type} sx={{ textTransform: 'capitalize' }}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price (ETB)"
                    type="number"
                    value={propertyData.price}
                    onChange={(e) => handlePropertyChange('price', e.target.value)}
                    error={!!errors.price}
                    helperText={errors.price}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Size (sq ft)"
                    type="number"
                    value={propertyData.size}
                    onChange={(e) => handlePropertyChange('size', e.target.value)}
                  />
                </Grid>

                {propertyData.type === 'residential' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Bedrooms"
                        type="number"
                        value={propertyData.bedrooms}
                        onChange={(e) => handlePropertyChange('bedrooms', e.target.value)}
                        error={!!errors.bedrooms}
                        helperText={errors.bedrooms}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Bathrooms"
                        type="number"
                        value={propertyData.bathrooms}
                        onChange={(e) => handlePropertyChange('bathrooms', e.target.value)}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" mb={2}>
                    Address
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={propertyData.street}
                    onChange={(e) => handlePropertyChange('street', e.target.value)}
                    error={!!errors.street}
                    helperText={errors.street}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={propertyData.city}
                    onChange={(e) => handlePropertyChange('city', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State/Region"
                    value={propertyData.state}
                    onChange={(e) => handlePropertyChange('state', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={propertyData.country}
                    onChange={(e) => handlePropertyChange('country', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description (optional)"
                    placeholder="Additional details about the property…"
                    value={propertyData.description}
                    onChange={(e) => handlePropertyChange('description', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 1: Owner Information */}
          {activeStep === 1 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Person color="primary" />
                <Typography variant="h6">Owner Information</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={ownerData.name}
                    onChange={(e) => handleOwnerChange('name', e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ID Number"
                    placeholder="National ID or Passport"
                    value={ownerData.idNumber}
                    onChange={(e) => handleOwnerChange('idNumber', e.target.value)}
                    error={!!errors.idNumber}
                    helperText={errors.idNumber}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={ownerData.email}
                    onChange={(e) => handleOwnerChange('email', e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    placeholder="+251 9XX XXX XXX"
                    value={ownerData.phone}
                    onChange={(e) => handleOwnerChange('phone', e.target.value)}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 2: Upload Documents */}
          {activeStep === 2 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Description color="primary" />
                <Typography variant="h6">Upload Documents</Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Required documents for {propertyData.type} property:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {requiredDocs.map((doc) => (
                    <Chip
                      key={doc}
                      label={formatDocType(doc)}
                      size="small"
                      color={uploadedTypes.includes(doc) ? 'success' : 'default'}
                      icon={uploadedTypes.includes(doc) ? <CheckCircle /> : undefined}
                    />
                  ))}
                </Box>
              </Alert>

              {errors.documents && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.documents}
                </Alert>
              )}

              <Paper variant="outlined" sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1" mb={1}>
                  Upload property documents
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Supported formats: PDF, JPG, PNG (Max 10MB per file)
                </Typography>
                <Button variant="contained" component="label" startIcon={<Upload />}>
                  Choose Files
                  <input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
                </Button>
              </Paper>

              {documents.length > 0 && (
                <List>
                  {documents.map((doc) => (
                    <ListItem
                      key={doc.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: 'background.paper',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Description color="action" sx={{ mr: 2 }} />
                        <ListItemText
                          primary={doc.name}
                          secondary={doc.size}
                          slotProps={{ primary: { fontWeight: 600 } }}
                        />
                      </Box>
                      <TextField
                        select
                        size="small"
                        label="Document Type"
                        value={doc.type}
                        onChange={(e) => handleDocTypeChange(doc.id, e.target.value)}
                        sx={{ minWidth: 200, mr: 1 }}
                        required
                      >
                        {requiredDocs.map((type) => (
                          <MenuItem key={type} value={type}>
                            {formatDocType(type)}
                          </MenuItem>
                        ))}
                      </TextField>
                      <IconButton edge="end" onClick={() => handleRemoveDoc(doc.id)} color="error">
                        <Delete />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}

              {missingDocs.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Still missing: {missingDocs.map(formatDocType).join(', ')}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />}>
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<Save />}
              >
                {loading ? 'Registering…' : 'Register Property'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* View Owner Dialog with Tabs */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>{selectedOwner?.name.charAt(0)}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={600}>{selectedOwner?.name}</Typography>
              <Chip label={selectedOwner?.status} color={selectedOwner?.status === 'verified' ? 'success' : 'warning'} size="small" />
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
                    <ListItem><ListItemText primary="Status" secondary={<Chip label={selectedOwner.status} color={selectedOwner.status === 'verified' ? 'success' : 'warning'} size="small" />} /></ListItem>
                    <ListItem><ListItemText primary="Registered Date" secondary={new Date(selectedOwner.registeredDate).toLocaleDateString()} /></ListItem>
                    <ListItem><ListItemText primary="Properties Count" secondary={selectedOwner.properties?.length || 0} /></ListItem>
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedOwner.status !== 'verified' && (
                      <Button variant="contained" color="success" size="small" startIcon={<VerifiedUser />}>
                        Verify Owner
                      </Button>
                    )}
                    {selectedOwner.status !== 'suspended' && (
                      <Button variant="outlined" color="error" size="small">
                        Suspend Owner
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
                    <List>
                      {selectedOwner.properties.map((prop) => (
                        <Card key={prop.id} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600}>{prop.title}</Typography>
                              <Chip label={prop.status} color={prop.status === 'approved' ? 'success' : 'warning'} size="small" />
                            </Box>
                            <Grid container spacing={1}>
                              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Type: <strong>{prop.type}</strong></Typography></Grid>
                              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Listing: <strong>{prop.listingType}</strong></Typography></Grid>
                              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Price: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(prop.price)}</strong></Typography></Grid>
                              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Size: <strong>{prop.size} sq ft</strong></Typography></Grid>
                              {prop.bedrooms > 0 && <Grid item xs={6}><Typography variant="body2" color="text.secondary">Bedrooms: <strong>{prop.bedrooms}</strong></Typography></Grid>}
                              {prop.bathrooms > 0 && <Grid item xs={6}><Typography variant="body2" color="text.secondary">Bathrooms: <strong>{prop.bathrooms}</strong></Typography></Grid>}
                              <Grid item xs={12}><Typography variant="body2" color="text.secondary">Address: <strong>{prop.street}, {prop.city}</strong></Typography></Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </List>
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
                                        <IconButton size="small" color="success">
                                          <CheckCircle fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Reject">
                                        <IconButton size="small" color="error">
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
                              <Description color="action" sx={{ mr: 2 }} />
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={500}>{doc.name}</Typography>
                                    <Chip label={doc.status} color={docStatus.color} size="small" icon={docStatus.icon} />
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {doc.type.replace(/_/g, ' ')} • Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
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
    </Box>
  );
}

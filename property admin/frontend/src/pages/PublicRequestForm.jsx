import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, Grid,
  Alert, MenuItem, Container, Paper, Stepper, Step, StepLabel,
} from '@mui/material';
import { PersonAdd, Send } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const REQUEST_TYPES = [
  { value: 'owner', label: 'Property Owner - I want to list my properties' },
  { value: 'buyer', label: 'Buyer - I want to buy a property' },
  { value: 'renter', label: 'Renter - I want to rent a property' },
];

const PROPERTY_TYPES = ['residential', 'commercial', 'land', 'industrial'];
const RENTAL_DURATIONS = ['monthly', 'quarterly', 'yearly'];

export default function PublicRequestForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [requestType, setRequestType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    address: '',
    propertyCount: '',
    budget: '',
    preferredType: 'residential',
    preferredLocation: '',
    rentalDuration: 'monthly',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep1 = () => {
    if (!requestType) {
      alert('Please select a request type');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.idNumber.trim()) errors.idNumber = 'ID number is required';
    
    if (requestType === 'owner') {
      if (!formData.address.trim()) errors.address = 'Address is required';
    }
    
    if (requestType === 'buyer' || requestType === 'renter') {
      if (!formData.budget || formData.budget <= 0) errors.budget = 'Valid budget is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) return;
    if (activeStep === 1 && !validateStep2()) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    try {
      setLoading(true);
      const requestData = {
        type: requestType,
        data: {}
      };
      
      // Common fields
      requestData.data.name = formData.name;
      requestData.data.email = formData.email;
      requestData.data.phone = formData.phone;
      requestData.data.idNumber = formData.idNumber;
      requestData.data.notes = formData.notes;
      
      // Type-specific fields
      if (requestType === 'owner') {
        requestData.data.address = formData.address;
        requestData.data.propertyCount = parseInt(formData.propertyCount) || 0;
      } else if (requestType === 'buyer') {
        requestData.data.budget = parseFloat(formData.budget);
        requestData.data.preferredType = formData.preferredType;
        requestData.data.preferredLocation = formData.preferredLocation;
      } else if (requestType === 'renter') {
        requestData.data.budget = parseFloat(formData.budget);
        requestData.data.preferredType = formData.preferredType;
        requestData.data.preferredLocation = formData.preferredLocation;
        requestData.data.rentalDuration = formData.rentalDuration;
      }
      
      await axios.post(`${API_URL}/requests`, requestData);
      setSuccessMsg('Your request has been submitted successfully! Our admin team will review it shortly.');
      setActiveStep(3);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        idNumber: '',
        address: '',
        propertyCount: '',
        budget: '',
        preferredType: 'residential',
        preferredLocation: '',
        rentalDuration: 'monthly',
        notes: '',
      });
      setRequestType('');
    } catch (error) {
      setErrorMsg('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Select Type', 'Enter Details', 'Review & Submit'];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <PersonAdd sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Registration Request
          </Typography>
          <Typography color="text.secondary">
            Submit your request to register as a property owner, buyer, or renter
          </Typography>
        </Box>

        {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Select Request Type</Typography>
            <Grid container spacing={2}>
              {REQUEST_TYPES.map((type) => (
                <Grid item xs={12} key={type.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: 2,
                      borderColor: requestType === type.value ? 'primary.main' : 'transparent',
                      '&:hover': { borderColor: 'primary.light' }
                    }}
                    onClick={() => setRequestType(type.value)}
                  >
                    <CardContent>
                      <Typography variant="body1" fontWeight={600}>{type.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Enter Your Details</Typography>
            <Grid container spacing={2}>
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

              {requestType === 'owner' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      error={!!formErrors.address}
                      helperText={formErrors.address}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Number of Properties"
                      type="number"
                      value={formData.propertyCount}
                      onChange={(e) => handleFormChange('propertyCount', e.target.value)}
                    />
                  </Grid>
                </>
              )}

              {(requestType === 'buyer' || requestType === 'renter') && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={requestType === 'buyer' ? 'Budget (ETB)' : 'Monthly Budget (ETB)'}
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
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                          {t}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Preferred Location"
                      placeholder="e.g., Kezira, City Center"
                      value={formData.preferredLocation}
                      onChange={(e) => handleFormChange('preferredLocation', e.target.value)}
                    />
                  </Grid>
                </>
              )}

              {requestType === 'renter' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Rental Duration"
                    value={formData.rentalDuration}
                    onChange={(e) => handleFormChange('rentalDuration', e.target.value)}
                  >
                    {RENTAL_DURATIONS.map((d) => (
                      <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>
                        {d}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Notes"
                  placeholder="Any additional information you'd like to share..."
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Review Your Information</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please review your information before submitting
            </Alert>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Request Type</Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom sx={{ textTransform: 'capitalize' }}>
                  {requestType}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Name</Typography>
                <Typography variant="body1" gutterBottom>{formData.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Email</Typography>
                <Typography variant="body1" gutterBottom>{formData.email}</Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Phone</Typography>
                <Typography variant="body1" gutterBottom>{formData.phone}</Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {activeStep === 3 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMsg}
            </Alert>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              You will receive an email notification once your request is reviewed.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setActiveStep(0);
                setSuccessMsg('');
              }}
              sx={{ mt: 2 }}
            >
              Submit Another Request
            </Button>
          </Box>
        )}

        {activeStep < 3 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === 2 ? handleSubmit : handleNext}
              startIcon={activeStep === 2 ? <Send /> : null}
              disabled={loading}
            >
              {activeStep === 2 ? 'Submit Request' : 'Next'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

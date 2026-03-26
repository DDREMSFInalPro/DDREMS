const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/fileDb');

// Initialize requests collection
db.initializeCollection('requests', [
  {
    _id: 'req1',
    type: 'owner',
    status: 'pending',
    submittedDate: '2026-03-20T10:00:00Z',
    data: {
      name: 'Ahmed Hassan',
      email: 'ahmed.h@example.com',
      phone: '+251911234567',
      idNumber: 'ID-2024-001',
      address: 'Kezira, Dire Dawa',
      propertyCount: 2,
      notes: 'I own two properties and want to list them'
    }
  },
  {
    _id: 'req2',
    type: 'buyer',
    status: 'pending',
    submittedDate: '2026-03-21T14:30:00Z',
    data: {
      name: 'Sara Tesfaye',
      email: 'sara.t@example.com',
      phone: '+251922345678',
      idNumber: 'ID-2024-002',
      budget: 5000000,
      preferredType: 'residential',
      preferredLocation: 'City Center',
      notes: 'Looking for 3-bedroom apartment'
    }
  },
  {
    _id: 'req3',
    type: 'renter',
    status: 'approved',
    submittedDate: '2026-03-19T09:00:00Z',
    approvedDate: '2026-03-20T11:00:00Z',
    approvedBy: 'Admin User',
    data: {
      name: 'Mohammed Ali',
      email: 'mohammed.a@example.com',
      phone: '+251933456789',
      idNumber: 'ID-2024-003',
      budget: 15000,
      preferredType: 'commercial',
      preferredLocation: 'Melka Jebdu',
      rentalDuration: 'yearly',
      notes: 'Need office space for business'
    }
  }
]);

// Get all requests
router.get('/', (req, res) => {
  try {
    const { type, status } = req.query;
    let requests = db.findAll('requests');
    
    if (type) {
      requests = requests.filter(r => r.type === type);
    }
    
    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single request
router.get('/:id', (req, res) => {
  try {
    const request = db.findById('requests', req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit new request
router.post('/', (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }
    
    const newRequest = {
      _id: uuidv4(),
      type,
      status: 'pending',
      submittedDate: new Date().toISOString(),
      data
    };
    
    db.create('requests', newRequest);
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve request
router.post('/:id/approve', (req, res) => {
  try {
    const request = db.findById('requests', req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }
    
    // Update request status
    const updatedRequest = {
      ...request,
      status: 'approved',
      approvedDate: new Date().toISOString(),
      approvedBy: req.body.approvedBy || 'Admin User'
    };
    
    db.update('requests', req.params.id, updatedRequest);
    
    // Create the actual record based on type
    let createdRecord;
    if (request.type === 'owner') {
      createdRecord = {
        _id: uuidv4(),
        ...request.data,
        status: 'active',
        registeredDate: new Date().toISOString(),
        properties: [],
        documents: []
      };
      db.create('owners', createdRecord);
    } else if (request.type === 'buyer') {
      createdRecord = {
        _id: uuidv4(),
        ...request.data,
        status: 'active',
        registeredDate: new Date().toISOString(),
        interestedProperties: []
      };
      db.create('buyers', createdRecord);
    } else if (request.type === 'renter') {
      createdRecord = {
        _id: uuidv4(),
        ...request.data,
        status: 'active',
        registeredDate: new Date().toISOString(),
        currentRentals: [],
        rentalHistory: [],
        paymentHistory: []
      };
      db.create('renters', createdRecord);
    }
    
    res.json({ request: updatedRequest, created: createdRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject request
router.post('/:id/reject', (req, res) => {
  try {
    const request = db.findById('requests', req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }
    
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const updatedRequest = {
      ...request,
      status: 'rejected',
      rejectedDate: new Date().toISOString(),
      rejectedBy: req.body.rejectedBy || 'Admin User',
      rejectionReason: reason
    };
    
    db.update('requests', req.params.id, updatedRequest);
    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete request
router.delete('/:id', (req, res) => {
  try {
    db.deleteItem('requests', req.params.id);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

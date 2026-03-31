const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// ============================================================================
// PROPERTY DOCUMENTS
// ============================================================================

router.get('/property/:propertyId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('property_documents')
      .select('*, users(name)')
      .eq('property_id', req.params.propertyId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(d => ({ ...d, uploaded_by_name: d.users?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/property-doc/:docId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('property_documents')
      .select('*, users(name)')
      .eq('id', req.params.docId)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Document not found' });
    res.json({ ...data, uploaded_by_name: data.users?.name });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/property/:propertyId', async (req, res) => {
  try {
    const { document_type, document_name, document_path, uploaded_by } = req.body;
    const { data, error } = await supabase
      .from('property_documents')
      .insert({ property_id: req.params.propertyId, document_type, document_name, document_path, uploaded_by })
      .select('id').single();
    if (error) throw error;
    res.status(201).json({ id: data.id, message: 'Document uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/property-doc/:docId', async (req, res) => {
  try {
    const { error } = await supabase.from('property_documents').delete().eq('id', req.params.docId);
    if (error) throw error;
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================================================
// AGREEMENT DOCUMENTS
// ============================================================================

router.get('/agreement/:agreementId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agreement_documents')
      .select('*, users(name)')
      .eq('agreement_request_id', req.params.agreementId)
      .order('version', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(d => ({ ...d, generated_by_name: d.users?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/agreement-doc/:docId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agreement_documents')
      .select('*, users(name)')
      .eq('id', req.params.docId)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Document not found' });
    res.json({ ...data, generated_by_name: data.users?.name });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/agreement/:agreementId', async (req, res) => {
  try {
    const { version, document_type, document_content, generated_by_id } = req.body;
    const { data, error } = await supabase
      .from('agreement_documents')
      .insert({ agreement_request_id: req.params.agreementId, version: version || 1, document_type, document_content, generated_by_id })
      .select('id').single();
    if (error) throw error;
    res.status(201).json({ id: data.id, message: 'Agreement document created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/agreement-doc/:docId', async (req, res) => {
  try {
    const { document_content, document_type } = req.body;
    const { error } = await supabase
      .from('agreement_documents')
      .update({ document_content, document_type, updated_at: new Date().toISOString() })
      .eq('id', req.params.docId);
    if (error) throw error;
    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/agreement-doc/:docId', async (req, res) => {
  try {
    const { error } = await supabase.from('agreement_documents').delete().eq('id', req.params.docId);
    if (error) throw error;
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================================================
// DOCUMENT ACCESS
// ============================================================================

router.get('/access-requests/:propertyId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('document_access')
      .select('*, users(name, email)')
      .eq('property_id', req.params.propertyId)
      .order('requested_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, user_name: r.users?.name, email: r.users?.email })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/request-access', async (req, res) => {
  try {
    const { property_id, user_id } = req.body;
    const { data: existing } = await supabase.from('document_access').select('id').eq('property_id', property_id).eq('user_id', user_id).eq('status', 'pending').single();
    if (existing) return res.status(400).json({ message: 'Access request already pending' });

    const { data, error } = await supabase.from('document_access').insert({ property_id, user_id, status: 'pending' }).select('id').single();
    if (error) throw error;
    res.status(201).json({ id: data.id, message: 'Access request submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/access-request/:requestId/approve', async (req, res) => {
  try {
    const { error } = await supabase.from('document_access')
      .update({ status: 'approved', response_message: req.body.response_message || 'Access approved', responded_at: new Date().toISOString() })
      .eq('id', req.params.requestId);
    if (error) throw error;
    res.json({ message: 'Access approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/access-request/:requestId/reject', async (req, res) => {
  try {
    const { error } = await supabase.from('document_access')
      .update({ status: 'rejected', response_message: req.body.response_message || 'Access rejected', responded_at: new Date().toISOString() })
      .eq('id', req.params.requestId);
    if (error) throw error;
    res.json({ message: 'Access rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

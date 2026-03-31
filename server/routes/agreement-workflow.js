const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

const getAgreement = async (id) => {
  const { data } = await supabase.from('agreement_requests').select('*').eq('id', id).single();
  return data;
};

const logHistory = async (agreementId, step, stepName, action, actionById, prevStatus, newStatus, notes) => {
  await supabase.from('agreement_workflow_history').insert({ agreement_request_id: agreementId, step_number: step, step_name: stepName, action, action_by_id: actionById, previous_status: prevStatus, new_status: newStatus, notes });
};

const notifyAgreement = async (agreementId, recipientId, type, title, message) => {
  if (!recipientId) return;
  await supabase.from('agreement_notifications').insert({ agreement_request_id: agreementId, recipient_id: recipientId, notification_type: type, notification_title: title, notification_message: message });
};

// Step 1: Customer initiates request
router.post('/request', async (req, res) => {
  try {
    const { customer_id, property_id, customer_notes } = req.body;
    if (!customer_id || !property_id) return res.status(400).json({ message: 'Customer ID and Property ID required', success: false });

    const { data: property } = await supabase.from('properties').select('owner_id, price').eq('id', property_id).single();
    if (!property) return res.status(404).json({ message: 'Property not found', success: false });
    if (!property.owner_id) return res.status(400).json({ message: 'Property does not have an owner assigned', success: false });

    const { data: newReq, error } = await supabase.from('agreement_requests')
      .insert({ customer_id, owner_id: property.owner_id, property_id, status: 'pending_admin_review', current_step: 1, customer_notes, property_price: property.price })
      .select('id').single();
    if (error) throw error;

    await logHistory(newReq.id, 1, 'Customer Request', 'created', customer_id, null, 'pending_admin_review', 'Customer initiated agreement request');

    const { data: admins } = await supabase.from('users').select('id').eq('role', 'property_admin').limit(1);
    if (admins?.length) await notifyAgreement(newReq.id, admins[0].id, 'request_received', 'New Agreement Request', 'Customer has requested an agreement for a property');

    res.json({ success: true, message: 'Agreement request created successfully', agreement_id: newReq.id, status: 'pending_admin_review', current_step: 1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Step 2: Admin forwards to owner
router.put('/:agreementId/forward-to-owner', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, admin_notes } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ status: 'waiting_owner_response', current_step: 2, property_admin_id: admin_id, forwarded_to_owner_date: now, admin_notes, updated_at: now }).eq('id', agreementId);
    await logHistory(agreementId, 2, 'Forward to Owner', 'forwarded', admin_id, 'pending_admin_review', 'waiting_owner_response', admin_notes);
    await notifyAgreement(agreementId, agreement.owner_id, 'forwarded_to_owner', 'Agreement Request Forwarded', 'Property admin has forwarded an agreement request for your review');

    res.json({ success: true, message: 'Agreement forwarded to owner', status: 'waiting_owner_response', current_step: 2 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Step 3: Owner decision
router.put('/:agreementId/owner-decision', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { owner_id, decision, owner_notes } = req.body;
    if (!['accepted', 'rejected'].includes(decision)) return res.status(400).json({ message: 'Invalid decision', success: false });

    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const new_status = decision === 'accepted' ? 'owner_accepted' : 'owner_rejected';
    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ status: new_status, current_step: 3, owner_decision: decision, owner_decision_date: now, owner_notes, updated_at: now }).eq('id', agreementId);
    await logHistory(agreementId, 3, 'Owner Decision', decision, owner_id, 'waiting_owner_response', new_status, owner_notes);
    await notifyAgreement(agreementId, agreement.property_admin_id, decision, decision === 'accepted' ? 'Owner Accepted Agreement' : 'Owner Rejected Agreement', decision === 'accepted' ? 'Owner has accepted the agreement request' : 'Owner has rejected the agreement request');
    if (decision === 'rejected') await notifyAgreement(agreementId, agreement.customer_id, 'owner_rejected', 'Agreement Request Rejected', 'Owner has rejected your agreement request');

    res.json({ success: true, message: `Agreement ${decision} by owner`, status: new_status, current_step: 3 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Step 4: Admin generates agreement
router.post('/:agreementId/generate-agreement', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, template_id } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const { data: template } = await supabase.from('agreement_templates').select('*').eq('id', template_id || 1).single();
    const document_content = JSON.stringify({ agreement_id: agreementId, customer_id: agreement.customer_id, owner_id: agreement.owner_id, property_id: agreement.property_id, property_price: agreement.property_price, template: template?.template_content || null, created_date: new Date().toISOString() });

    const { data: doc, error } = await supabase.from('agreement_documents').insert({ agreement_request_id: agreementId, version: 1, document_type: 'initial', document_content, generated_by_id: admin_id }).select('id').single();
    if (error) throw error;

    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ status: 'agreement_generated', current_step: 4, agreement_generated_date: now, updated_at: now }).eq('id', agreementId);
    await logHistory(agreementId, 4, 'Generate Agreement', 'generated', admin_id, 'owner_accepted', 'agreement_generated');
    await notifyAgreement(agreementId, agreement.customer_id, 'agreement_generated', 'Agreement Generated', 'Your agreement document has been generated. Please review and complete it.');

    res.json({ success: true, message: 'Agreement generated successfully', document_id: doc.id, status: 'agreement_generated', current_step: 4 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Get agreement fields
router.get('/:agreementId/fields', async (req, res) => {
  try {
    const { data, error } = await supabase.from('agreement_fields').select('*').eq('agreement_request_id', req.params.agreementId).order('field_name');
    if (error) throw error;
    res.json({ success: true, fields: data || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Auto-populate agreement fields
router.get('/:agreementId/auto-populate-fields', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const [{ data: customerProfile }, { data: customerUser }, { data: ownerProfile }, { data: ownerUser }, { data: property }] = await Promise.all([
      supabase.from('customer_profiles').select('*').eq('user_id', agreement.customer_id).single(),
      supabase.from('users').select('*').eq('id', agreement.customer_id).single(),
      supabase.from('owner_profiles').select('*').eq('user_id', agreement.owner_id).single(),
      supabase.from('users').select('*').eq('id', agreement.owner_id).single(),
      supabase.from('properties').select('*').eq('id', agreement.property_id).single(),
    ]);

    const { data: propertyDocs } = await supabase.from('property_documents').select('*').eq('property_id', agreement.property_id);

    const fields = {};
    fields['customer_full_name'] = customerProfile?.full_name || customerUser?.name;
    fields['customer_email'] = customerUser?.email;
    fields['customer_phone'] = customerProfile?.phone_number || customerUser?.phone;
    fields['customer_address'] = customerProfile?.address;
    fields['owner_full_name'] = ownerProfile?.full_name || ownerUser?.name;
    fields['owner_email'] = ownerUser?.email;
    fields['owner_phone'] = ownerProfile?.phone_number || ownerUser?.phone;
    fields['owner_address'] = ownerProfile?.address;
    if (property) {
      fields['property_title'] = property.title;
      fields['property_type'] = property.type;
      fields['property_location'] = property.location;
      fields['property_price'] = String(property.price);
      fields['property_bedrooms'] = property.bedrooms ? String(property.bedrooms) : 'N/A';
      fields['property_bathrooms'] = property.bathrooms ? String(property.bathrooms) : 'N/A';
      fields['property_area'] = property.area ? String(property.area) : 'N/A';
    }
    fields['property_documents_count'] = String(propertyDocs?.length || 0);
    fields['property_documents_list'] = propertyDocs?.length ? propertyDocs.map(d => d.document_name).join(', ') : 'No documents uploaded';
    fields['agreement_property_price'] = String(agreement.property_price);
    fields['agreement_commission_percentage'] = agreement.commission_percentage ? `${agreement.commission_percentage}%` : '5%';
    fields['agreement_date'] = new Date().toISOString().split('T')[0];

    const upserts = Object.entries(fields).map(([field_name, field_value]) => ({ agreement_request_id: agreementId, field_name, field_value, is_editable: !field_name.startsWith('agreement_') }));
    await supabase.from('agreement_fields').upsert(upserts, { onConflict: 'agreement_request_id,field_name' });

    res.json({ success: true, message: 'Agreement fields auto-populated successfully', fields });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Update fields
router.put('/:agreementId/update-fields', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { customer_id, fields } = req.body;
    if (!fields || typeof fields !== 'object') return res.status(400).json({ message: 'Fields object required', success: false });

    const upserts = Object.entries(fields).map(([field_name, field_value]) => ({ agreement_request_id: agreementId, field_name, field_value, edited_by_id: customer_id, is_editable: true, edited_date: new Date().toISOString() }));
    await supabase.from('agreement_fields').upsert(upserts, { onConflict: 'agreement_request_id,field_name' });

    res.json({ success: true, message: 'Agreement fields updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Submit agreement (step 6)
router.post('/:agreementId/submit-agreement', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { customer_id, payment_method, payment_amount, receipt_file_path } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const { data: payment, error } = await supabase.from('agreement_payments').insert({ agreement_request_id: agreementId, payment_method, payment_amount, receipt_file_path }).select('id').single();
    if (error) throw error;

    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ status: 'customer_submitted', current_step: 6, customer_submitted_date: now, updated_at: now }).eq('id', agreementId);
    await logHistory(agreementId, 6, 'Customer Submission', 'submitted', customer_id, 'customer_editing', 'customer_submitted');
    await notifyAgreement(agreementId, agreement.property_admin_id, 'customer_submitted', 'Agreement Submitted by Customer', 'Customer has submitted the completed agreement with payment');

    res.json({ success: true, message: 'Agreement submitted successfully', payment_id: payment.id, status: 'customer_submitted', current_step: 6 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Step 7: Admin review
router.put('/:agreementId/admin-review', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, action, admin_notes } = req.body;
    if (!['approved', 'rejected', 'suspended'].includes(action)) return res.status(400).json({ message: 'Invalid action', success: false });

    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const new_status = action === 'approved' ? 'waiting_owner_final_review' : action;
    const next_step = action === 'approved' ? 8 : 7;
    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ status: new_status, current_step: next_step, admin_action: action, admin_action_date: now, admin_notes, updated_at: now }).eq('id', agreementId);
    await logHistory(agreementId, 7, 'Admin Review', action, admin_id, 'customer_submitted', new_status, admin_notes);

    if (action === 'approved') await notifyAgreement(agreementId, agreement.owner_id, 'admin_approved', 'Agreement Approved by Admin', 'Admin has approved your agreement. Awaiting owner final review.');
    else if (action === 'rejected') await notifyAgreement(agreementId, agreement.customer_id, 'admin_rejected', 'Agreement Rejected', 'Admin has rejected the agreement.');

    res.json({ success: true, message: `Agreement ${action} by admin`, status: new_status, current_step: next_step });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Step 9: Owner final review
router.post('/:agreementId/owner-final-review', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { owner_id, owner_notes } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ status: 'owner_submitted', current_step: 9, owner_final_submitted_date: now, owner_notes, updated_at: now }).eq('id', agreementId);
    await logHistory(agreementId, 9, 'Owner Final Submission', 'submitted', owner_id, 'waiting_owner_final_review', 'owner_submitted', owner_notes);
    await notifyAgreement(agreementId, agreement.property_admin_id, 'owner_submitted', 'Owner Submitted Final Agreement', 'Owner has submitted the final agreement. Ready for commission calculation.');

    res.json({ success: true, message: 'Owner final review submitted', status: 'owner_submitted', current_step: 9 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Step 10: Calculate commission
router.post('/:agreementId/calculate-commission', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, commission_percentage } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const property_price = agreement.property_price;
    const commission_pct = commission_percentage || 5.00;
    const customer_commission = (property_price * commission_pct) / 100;
    const owner_commission = (property_price * commission_pct) / 100;
    const total_commission = customer_commission + owner_commission;
    const now = new Date().toISOString();

    await supabase.from('agreement_requests').update({ commission_percentage: commission_pct, customer_commission, owner_commission, total_commission, commission_calculated_date: now, updated_at: now }).eq('id', agreementId);
    await supabase.from('agreement_commissions').insert([
      { agreement_request_id: agreementId, commission_type: 'customer', recipient_id: agreement.customer_id, property_price, commission_percentage: commission_pct, commission_amount: customer_commission, calculated_by_id: admin_id },
      { agreement_request_id: agreementId, commission_type: 'owner', recipient_id: agreement.owner_id, property_price, commission_percentage: commission_pct, commission_amount: owner_commission, calculated_by_id: admin_id },
    ]);
    await logHistory(agreementId, 10, 'Commission Calculation', 'calculated', admin_id, 'owner_submitted', 'ready_for_handshake');
    await notifyAgreement(agreementId, agreement.customer_id, 'commission_calculated', 'Commission Calculated', 'Commission has been calculated. Ready for final handshake.');
    await notifyAgreement(agreementId, agreement.owner_id, 'commission_calculated', 'Commission Calculated', 'Commission has been calculated. Ready for final handshake.');

    res.json({ success: true, message: 'Commission calculated successfully', customer_commission, owner_commission, total_commission, status: 'ready_for_handshake' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Final handshake
router.post('/:agreementId/final-handshake', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { user_id, user_role } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    await supabase.from('agreement_signatures').insert({ agreement_request_id: agreementId, signer_id: user_id, signer_role: user_role });

    const { count } = await supabase.from('agreement_signatures').select('signer_role', { count: 'exact', head: false }).eq('agreement_request_id', agreementId);
    const uniqueRoles = new Set();
    const { data: sigs } = await supabase.from('agreement_signatures').select('signer_role').eq('agreement_request_id', agreementId);
    sigs?.forEach(s => uniqueRoles.add(s.signer_role));
    const both_signed = uniqueRoles.size >= 2;

    if (both_signed) {
      const { data: tx } = await supabase.from('agreement_transactions').insert({ agreement_request_id: agreementId, transaction_type: 'sale', transaction_status: 'completed', buyer_id: agreement.customer_id, seller_id: agreement.owner_id, property_id: agreement.property_id, transaction_amount: agreement.property_price, commission_amount: agreement.total_commission, net_amount: agreement.property_price - agreement.total_commission }).select('id').single();

      const now = new Date().toISOString();
      await supabase.from('agreement_requests').update({ status: 'completed', current_step: 10, completed_date: now, updated_at: now }).eq('id', agreementId);
      await logHistory(agreementId, 10, 'Final Handshake', 'completed', user_id, 'ready_for_handshake', 'completed');
      await notifyAgreement(agreementId, agreement.customer_id, 'transaction_completed', 'Transaction Completed', 'Congratulations! You have successfully completed the property transaction.');
      await notifyAgreement(agreementId, agreement.owner_id, 'transaction_completed', 'Property Sold', 'Your property has been successfully sold. Commission has been calculated.');

      return res.json({ success: true, message: 'Transaction completed successfully', transaction_id: tx?.id, status: 'completed', current_step: 10 });
    }

    res.json({ success: true, message: 'Handshake recorded. Awaiting other party signature.', status: 'ready_for_handshake', signatures_count: sigs?.length || 1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Get agreement details
router.get('/:agreementId', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { data: agreement } = await supabase.from('v_agreement_status').select('*').eq('id', agreementId).single();
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const [{ data: documents }, { data: payments }, { data: commissions }, { data: history }] = await Promise.all([
      supabase.from('agreement_documents').select('*').eq('agreement_request_id', agreementId).order('version', { ascending: false }),
      supabase.from('agreement_payments').select('*').eq('agreement_request_id', agreementId),
      supabase.from('agreement_commissions').select('*').eq('agreement_request_id', agreementId),
      supabase.from('agreement_workflow_history').select('*').eq('agreement_request_id', agreementId).order('action_date', { ascending: false }),
    ]);

    res.json({ success: true, agreement, documents: documents || [], payments: payments || [], commissions: commissions || [], history: history || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Get user agreements
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase.from('v_agreement_status').select('*').or(`customer_id.eq.${userId},owner_id.eq.${userId}`).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, agreements: data || [], count: data?.length || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Get admin pending
router.get('/admin/pending', async (req, res) => {
  try {
    const { data, error } = await supabase.from('v_agreement_status').select('*').in('status', ['pending_admin_review', 'customer_submitted', 'owner_submitted']).order('created_at');
    if (error) throw error;
    res.json({ success: true, agreements: data || [], count: data?.length || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

module.exports = router;

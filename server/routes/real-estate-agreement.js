const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

function generateAgreementHTML(agreement) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Real Estate Agreement</title>
  <style>body{font-family:Arial,sans-serif;margin:40px;line-height:1.6}.header{text-align:center;margin-bottom:30px}.section{margin-bottom:20px}.section-title{font-weight:bold;font-size:14px;margin-top:15px;margin-bottom:10px}table{width:100%;border-collapse:collapse}td{padding:8px;border:1px solid #ddd}.signature-line{margin-top:40px;border-top:1px solid #000;width:200px}</style>
  </head><body>
  <div class="header"><h1>REAL ESTATE AGREEMENT</h1><p>Agreement ID: ${agreement.id}</p><p>Date: ${new Date().toLocaleDateString()}</p></div>
  <div class="section"><div class="section-title">PROPERTY DETAILS</div><table>
  <tr><td><strong>Property Title:</strong></td><td>${agreement.title}</td></tr>
  <tr><td><strong>Location:</strong></td><td>${agreement.location}</td></tr>
  <tr><td><strong>Type:</strong></td><td>${agreement.type}</td></tr>
  <tr><td><strong>Price:</strong></td><td>${agreement.price} ETB</td></tr>
  <tr><td><strong>Area:</strong></td><td>${agreement.area} sq.m</td></tr>
  </table></div>
  <div class="section"><div class="section-title">BUYER INFORMATION</div><table>
  <tr><td><strong>Name:</strong></td><td>${agreement.customer_name}</td></tr>
  <tr><td><strong>ID:</strong></td><td>${agreement.customer_id}</td></tr>
  </table></div>
  <div class="section"><div class="section-title">SELLER INFORMATION</div><table>
  <tr><td><strong>Name:</strong></td><td>${agreement.owner_name}</td></tr>
  <tr><td><strong>ID:</strong></td><td>${agreement.owner_id}</td></tr>
  </table></div>
  <div class="section"><div class="section-title">FINANCIAL TERMS</div><table>
  <tr><td><strong>Agreement Amount:</strong></td><td>${agreement.price} ETB</td></tr>
  <tr><td><strong>Commission (5% Customer):</strong></td><td>${(agreement.price * 0.05).toFixed(2)} ETB</td></tr>
  <tr><td><strong>Commission (5% Owner):</strong></td><td>${(agreement.price * 0.05).toFixed(2)} ETB</td></tr>
  </table></div>
  <div class="section"><div class="section-title">SIGNATURES</div>
  <div style="margin-top:40px"><div style="display:inline-block;width:45%"><p><strong>Buyer Signature:</strong></p><div class="signature-line"></div><p>${agreement.customer_name}</p></div>
  <div style="display:inline-block;width:45%;margin-left:10%"><p><strong>Seller Signature:</strong></p><div class="signature-line"></div><p>${agreement.owner_name}</p></div></div></div>
  </body></html>`;
}

// Request agreement
router.post('/request', async (req, res) => {
  try {
    const { property_id, customer_notes } = req.body;
    const customer_id = req.user?.id || req.body.customer_id;
    if (!property_id || !customer_id) return res.status(400).json({ message: 'Missing required fields' });

    const { data: property } = await supabase.from('properties').select('*').eq('id', property_id).single();
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const { data: admin } = await supabase.from('users').select('id').eq('role', 'property_admin').limit(1).single();
    if (!admin) return res.status(400).json({ message: 'No property admin available' });

    const owner_id = property.owner_id || property.broker_id || admin.id;

    const { data: newReq, error } = await supabase.from('agreement_requests')
      .insert({ property_id, customer_id, owner_id, property_admin_id: admin.id, customer_notes, status: 'pending_admin_review', request_date: new Date().toISOString() })
      .select('id').single();
    if (error) throw error;

    await supabase.from('agreement_notifications').insert({ agreement_request_id: newReq.id, recipient_id: admin.id, notification_type: 'request_received', notification_title: 'New Agreement Request', notification_message: `New agreement request for property: ${property.title}`, sent_date: new Date().toISOString() });
    await supabase.from('agreement_audit_log').insert({ agreement_request_id: newReq.id, action_type: 'REQUEST_CREATED', action_description: 'Customer requested agreement', performed_by_id: customer_id, new_status: 'pending_admin_review' });

    res.json({ message: 'Agreement request created successfully', agreement_id: newReq.id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating agreement request', error: error.message });
  }
});

// Get customer agreements
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('agreement_requests')
      .select('*, properties(title, location, price, type), users!customer_id(name), owner:users!owner_id(name)')
      .eq('customer_id', req.params.customerId)
      .order('request_date', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(a => ({ ...a, property_title: a.properties?.title, property_location: a.properties?.location, property_price: a.properties?.price, property_type: a.properties?.type, customer_name: a.users?.name, owner_name: a.owner?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agreements', error: error.message });
  }
});

// Submit payment
router.post('/:agreementId/submit-payment', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { payment_method, payment_amount, receipt_file_path } = req.body;
    const customer_id = req.user?.id || req.body.customer_id;

    const { data: receipt, error } = await supabase.from('payment_receipts').insert({ agreement_request_id: agreementId, payment_method, payment_amount, receipt_file_path, verification_status: 'pending' }).select('id').single();
    if (error) throw error;

    await supabase.from('agreement_requests').update({ status: 'payment_submitted', updated_at: new Date().toISOString() }).eq('id', agreementId);

    const { data: agreement } = await supabase.from('agreement_requests').select('property_admin_id').eq('id', agreementId).single();
    if (agreement?.property_admin_id) {
      await supabase.from('agreement_notifications').insert({ agreement_request_id: agreementId, recipient_id: agreement.property_admin_id, notification_type: 'payment_submitted', notification_title: 'Payment Submitted', notification_message: 'Customer submitted payment for agreement', sent_date: new Date().toISOString() });
    }
    await supabase.from('agreement_audit_log').insert({ agreement_request_id: agreementId, action_type: 'PAYMENT_SUBMITTED', action_description: 'Customer submitted payment', performed_by_id: customer_id, new_status: 'payment_submitted' });

    res.json({ message: 'Payment submitted successfully', receipt_id: receipt.id });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting payment', error: error.message });
  }
});

// Admin pending
router.get('/admin/pending', async (req, res) => {
  try {
    const admin_id = req.user?.id || req.query.admin_id;
    const { data, error } = await supabase.from('agreement_requests')
      .select('*, properties(title, location, price, type), users!customer_id(name), owner:users!owner_id(name)')
      .eq('property_admin_id', admin_id)
      .in('status', ['pending_admin_review', 'submitted_by_customer'])
      .order('request_date');
    if (error) throw error;
    res.json((data || []).map(a => ({ ...a, property_title: a.properties?.title, customer_name: a.users?.name, owner_name: a.owner?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agreements', error: error.message });
  }
});

// Generate agreement document
router.post('/:agreementId/generate', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const admin_id = req.user?.id || req.body.admin_id;

    const { data: agreement } = await supabase.from('agreement_requests')
      .select('*, properties(*), users!customer_id(name), owner:users!owner_id(name)')
      .eq('id', agreementId).single();
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

    const docData = { ...agreement, title: agreement.properties?.title, location: agreement.properties?.location, type: agreement.properties?.type, price: agreement.properties?.price, area: agreement.properties?.area, customer_name: agreement.users?.name, owner_name: agreement.owner?.name };
    const documentHTML = generateAgreementHTML(docData);

    const { data: doc, error } = await supabase.from('agreement_documents').insert({ agreement_request_id: agreementId, version: 1, document_type: 'initial', document_html: documentHTML, generated_by_id: admin_id, generated_date: new Date().toISOString() }).select('id').single();
    if (error) throw error;

    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ status: 'forwarded_to_owner', forwarded_to_owner_date: now, updated_at: now }).eq('id', agreementId);
    await supabase.from('agreement_notifications').insert({ agreement_request_id: agreementId, recipient_id: agreement.owner_id, notification_type: 'agreement_forwarded', notification_title: 'Agreement Forwarded', notification_message: 'Agreement has been forwarded for your review', sent_date: now });
    await supabase.from('agreement_audit_log').insert({ agreement_request_id: agreementId, action_type: 'AGREEMENT_GENERATED', action_description: 'Admin generated agreement document', performed_by_id: admin_id, old_status: 'pending_admin_review', new_status: 'forwarded_to_owner' });

    res.json({ message: 'Agreement generated successfully', document_id: doc.id });
  } catch (error) {
    res.status(500).json({ message: 'Error generating agreement', error: error.message });
  }
});

// Forward to owner
router.post('/:agreementId/forward-to-owner', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const admin_id = req.user?.id || req.body.admin_id;
    const { data: agreement } = await supabase.from('agreement_requests').select('owner_id').eq('id', agreementId).single();
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ status: 'forwarded_to_owner', forwarded_to_owner_date: now, updated_at: now }).eq('id', agreementId);
    await supabase.from('agreement_notifications').insert({ agreement_request_id: agreementId, recipient_id: agreement.owner_id, notification_type: 'agreement_forwarded', notification_title: 'Agreement Forwarded', notification_message: 'Agreement forwarded for your review', sent_date: now });
    await supabase.from('agreement_audit_log').insert({ agreement_request_id: agreementId, action_type: 'FORWARDED_TO_OWNER', action_description: 'Admin forwarded agreement to owner', performed_by_id: admin_id, old_status: 'pending_admin_review', new_status: 'forwarded_to_owner' });

    res.json({ message: 'Agreement forwarded to owner successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error forwarding agreement', error: error.message });
  }
});

// Verify payment
router.post('/:agreementId/verify-payment', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { verification_status, verification_notes } = req.body;
    const admin_id = req.user?.id || req.body.admin_id;
    const now = new Date().toISOString();

    await supabase.from('payment_receipts').update({ verification_status, verification_notes, verified_by_id: admin_id, verification_date: now }).eq('agreement_request_id', agreementId);

    if (verification_status === 'verified') {
      const { data: agreement } = await supabase.from('agreement_requests').select('*, properties(price)').eq('id', agreementId).single();
      if (agreement) {
        const price = agreement.properties?.price || 0;
        const customer_commission = (price * 5) / 100;
        const owner_commission = (price * 5) / 100;
        const total_commission = customer_commission + owner_commission;

        await supabase.from('commission_tracking').insert({ agreement_request_id: agreementId, agreement_amount: price, customer_commission_percentage: 5, owner_commission_percentage: 5, customer_commission, owner_commission, total_commission, calculated_at: now });
        await supabase.from('agreement_requests').update({ status: 'completed', completion_date: now, updated_at: now }).eq('id', agreementId);

        await supabase.from('agreement_notifications').insert([
          { agreement_request_id: agreementId, recipient_id: agreement.customer_id, notification_type: 'payment_verified', notification_title: 'Payment Verified', notification_message: 'Your payment has been verified', sent_date: now },
          { agreement_request_id: agreementId, recipient_id: agreement.owner_id, notification_type: 'agreement_completed', notification_title: 'Agreement Completed', notification_message: 'Agreement has been completed', sent_date: now },
        ]);
      }
    }

    await supabase.from('agreement_audit_log').insert({ agreement_request_id: agreementId, action_type: 'PAYMENT_VERIFIED', action_description: `Payment verification: ${verification_status}`, performed_by_id: admin_id, new_status: 'payment_submitted' });

    res.json({ message: 'Payment verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
});

// Get owner agreements
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('agreement_requests')
      .select('*, properties(title, location, price, type), users!customer_id(name), owner:users!owner_id(name)')
      .eq('owner_id', req.params.ownerId)
      .order('request_date', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(a => ({ ...a, property_title: a.properties?.title, customer_name: a.users?.name, owner_name: a.owner?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agreements', error: error.message });
  }
});

// Owner response
router.post('/:agreementId/owner-response', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { response_status, response_message } = req.body;
    const owner_id = req.user?.id || req.body.owner_id;
    const newStatus = response_status === 'accepted' ? 'owner_approved' : 'owner_rejected';
    const now = new Date().toISOString();

    await supabase.from('agreement_requests').update({ status: newStatus, response_message, owner_response_date: now, updated_at: now }).eq('id', agreementId);

    const { data: agreement } = await supabase.from('agreement_requests').select('customer_id, property_admin_id').eq('id', agreementId).single();
    if (agreement) {
      const notifType = response_status === 'accepted' ? 'owner_approved' : 'owner_rejected';
      const notifTitle = response_status === 'accepted' ? 'Owner Approved' : 'Owner Rejected';
      const notifMsg = response_status === 'accepted' ? 'Owner has approved the agreement' : 'Owner has rejected the agreement';
      await supabase.from('agreement_notifications').insert([
        { agreement_request_id: agreementId, recipient_id: agreement.customer_id, notification_type: notifType, notification_title: notifTitle, notification_message: notifMsg, sent_date: now },
        { agreement_request_id: agreementId, recipient_id: agreement.property_admin_id, notification_type: notifType, notification_title: notifTitle, notification_message: notifMsg, sent_date: now },
      ]);
    }
    await supabase.from('agreement_audit_log').insert({ agreement_request_id: agreementId, action_type: 'OWNER_RESPONSE', action_description: `Owner ${response_status} agreement`, performed_by_id: owner_id, old_status: 'forwarded_to_owner', new_status: newStatus });

    res.json({ message: `Agreement ${response_status} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error processing response', error: error.message });
  }
});

module.exports = router;

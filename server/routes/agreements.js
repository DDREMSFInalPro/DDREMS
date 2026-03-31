const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Helper: Generate agreement HTML document
function generateAgreementHTML(agreement, property, owner, customer, ownerDocs, customerDocs) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Property Agreement - DDREMS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px double #16213e; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #16213e; margin-bottom: 5px; letter-spacing: 2px; }
    .header h2 { font-size: 18px; color: #0f3460; font-weight: normal; }
    .header .subtitle { font-size: 13px; color: #6b7280; margin-top: 8px; }
    .agreement-id { text-align: right; color: #6b7280; font-size: 12px; margin-bottom: 20px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: bold; color: #16213e; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { padding: 8px 12px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #3b82f6; }
    .info-item label { display: block; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item span { font-size: 14px; font-weight: 600; color: #1e293b; }
    .party-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #fafbfc; }
    .party-box h4 { color: #0f3460; margin-bottom: 8px; font-size: 14px; }
    .party-box p { font-size: 13px; color: #374151; line-height: 1.6; }
    .documents-list { list-style: none; padding: 0; }
    .documents-list li { padding: 8px 12px; background: #f1f5f9; margin-bottom: 6px; border-radius: 6px; font-size: 13px; }
    .terms-text { padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; line-height: 1.8; font-size: 14px; white-space: pre-wrap; }
    .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
    .signature-box { text-align: center; }
    .signature-box h4 { font-size: 14px; color: #16213e; margin-bottom: 10px; }
    .signature-line { border: 2px solid #d1d5db; border-radius: 8px; height: 100px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-style: italic; font-size: 13px; background: #fefefe; }
    .signature-line img { max-height: 90px; max-width: 90%; }
    .signature-name { font-size: 13px; color: #374151; border-top: 1px solid #374151; padding-top: 4px; margin-top: 8px; }
    .signature-date { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DDREMS</h1>
    <h2>Property Agreement</h2>
    <p class="subtitle">Dire Dawa Real Estate Management System</p>
  </div>
  <div class="agreement-id">Agreement #${agreement.id} | Date: ${today}</div>
  <div class="section">
    <h3 class="section-title">Property Information</h3>
    <div class="info-grid">
      <div class="info-item"><label>Property Title</label><span>${property.title || 'N/A'}</span></div>
      <div class="info-item"><label>Location</label><span>${property.location || 'N/A'}</span></div>
      <div class="info-item"><label>Type</label><span>${property.type || 'N/A'}</span></div>
      <div class="info-item"><label>Price</label><span>${Number(property.price || 0).toLocaleString()} ETB</span></div>
      <div class="info-item"><label>Area</label><span>${property.area ? property.area + ' sqm' : 'N/A'}</span></div>
      <div class="info-item"><label>Status</label><span>${property.status || 'N/A'}</span></div>
    </div>
  </div>
  <div class="section">
    <h3 class="section-title">Parties Involved</h3>
    <div class="info-grid">
      <div class="party-box"><h4>Property Owner</h4><p><strong>Name:</strong> ${owner.name || 'N/A'}</p><p><strong>Email:</strong> ${owner.email || 'N/A'}</p><p><strong>Phone:</strong> ${owner.phone || 'N/A'}</p></div>
      <div class="party-box"><h4>Customer / Buyer</h4><p><strong>Name:</strong> ${customer.name || 'N/A'}</p><p><strong>Email:</strong> ${customer.email || 'N/A'}</p><p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p></div>
    </div>
  </div>
  <div class="section">
    <h3 class="section-title">Documents Provided</h3>
    <div class="info-grid">
      <div><h4 style="font-size:13px;margin-bottom:8px;">Owner Documents</h4>
        <ul class="documents-list">${ownerDocs.length > 0 ? ownerDocs.map(d => `<li>${d.document_name} (${d.document_type})</li>`).join('') : '<li style="color:#9ca3af;">No documents uploaded</li>'}</ul>
      </div>
      <div><h4 style="font-size:13px;margin-bottom:8px;">Customer Documents</h4>
        <ul class="documents-list">${customerDocs.length > 0 ? customerDocs.map(d => `<li>${d.document_name} (${d.document_type})</li>`).join('') : '<li style="color:#9ca3af;">No documents uploaded</li>'}</ul>
      </div>
    </div>
  </div>
  <div class="section">
    <h3 class="section-title">Agreement Terms</h3>
    <div class="terms-text">${agreement.agreement_text || agreement.terms || 'Terms to be specified.'}</div>
  </div>
  <div class="signature-section">
    <div class="signature-box">
      <h4>Owner Signature</h4>
      <div class="signature-line">${agreement.owner_signature ? `<img src="${agreement.owner_signature}" alt="Owner Signature" />` : 'Sign here'}</div>
      <div class="signature-name">${owner.name || '________________'}</div>
      <div class="signature-date">${agreement.owner_signed_at ? new Date(agreement.owner_signed_at).toLocaleDateString() : 'Date: ___________'}</div>
    </div>
    <div class="signature-box">
      <h4>Customer Signature</h4>
      <div class="signature-line">${agreement.customer_signature ? `<img src="${agreement.customer_signature}" alt="Customer Signature" />` : 'Sign here'}</div>
      <div class="signature-name">${customer.name || '________________'}</div>
      <div class="signature-date">${agreement.customer_signed_at ? new Date(agreement.customer_signed_at).toLocaleDateString() : 'Date: ___________'}</div>
    </div>
  </div>
  <div class="footer"><p>This agreement is generated by DDREMS</p><p>Agreement ID: #${agreement.id} | Generated: ${today}</p></div>
</body>
</html>`;
}

// Get single agreement
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agreements')
      .select('*, properties(title, location, price, type, area, status), owner:users!owner_id(name, email, phone), customer:users!customer_id(name, email, phone)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Agreement not found', success: false });

    res.json({
      agreement: {
        ...data,
        property_title: data.properties?.title, property_location: data.properties?.location,
        property_price: data.properties?.price, property_type: data.properties?.type,
        property_area: data.properties?.area, property_status: data.properties?.status,
        owner_name: data.owner?.name, owner_email: data.owner?.email, owner_phone: data.owner?.phone,
        customer_name: data.customer?.name, customer_email: data.customer?.email, customer_phone: data.customer?.phone,
      },
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get owner agreements
router.get('/owner/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agreements')
      .select('*, properties(title, location, price), customer:users!customer_id(name, email)')
      .eq('owner_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(a => ({ ...a, property_title: a.properties?.title, property_location: a.properties?.location, property_price: a.properties?.price, customer_name: a.customer?.name, customer_email: a.customer?.email })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get broker agreements
router.get('/broker/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agreements')
      .select('*, properties(title, location, price), customer:users!customer_id(name, email)')
      .eq('broker_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(a => ({ ...a, property_title: a.properties?.title, property_location: a.properties?.location, property_price: a.properties?.price, customer_name: a.customer?.name, customer_email: a.customer?.email })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer agreements
router.get('/customer/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agreements')
      .select('*, properties(title, location, price), owner:users!owner_id(name, email)')
      .eq('customer_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(a => ({ ...a, property_title: a.properties?.title, property_location: a.properties?.location, property_price: a.properties?.price, owner_name: a.owner?.name, owner_email: a.owner?.email })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create agreement
router.post('/', async (req, res) => {
  try {
    const { property_id, owner_id, customer_id, broker_id, agreement_text, status } = req.body;
    const { data, error } = await supabase
      .from('agreements')
      .insert({ property_id, owner_id, customer_id, broker_id: broker_id || null, agreement_text, status: status || 'pending' })
      .select('id').single();
    if (error) throw error;
    res.status(201).json({ id: data.id, message: 'Agreement created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate agreement document
router.post('/:id/generate-document', async (req, res) => {
  try {
    const agreementId = req.params.id;

    const { data: agreement, error } = await supabase
      .from('agreements')
      .select('*, properties(id, title, location, price, type, area, status)')
      .eq('id', agreementId).single();
    if (error || !agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const [{ data: ownerUser }, { data: customerUser }] = await Promise.all([
      supabase.from('users').select('name, email, phone').eq('id', agreement.owner_id).single(),
      supabase.from('users').select('name, email, phone').eq('id', agreement.customer_id).single(),
    ]);

    const owner = ownerUser || { name: 'N/A', email: 'N/A', phone: 'N/A' };
    const customer = customerUser || { name: 'N/A', email: 'N/A', phone: 'N/A' };

    const { data: ownerDocs } = await supabase.from('property_documents').select('document_name, document_type').eq('property_id', agreement.properties?.id);
    const { data: custProfile } = await supabase.from('customer_profiles').select('id_document').eq('user_id', agreement.customer_id).single();
    const customerDocs = custProfile?.id_document ? [{ document_name: 'ID Document', document_type: 'identification' }] : [];

    const property = agreement.properties || {};
    const html = generateAgreementHTML(agreement, property, owner, customer, ownerDocs || [], customerDocs);

    await supabase.from('agreements').update({ agreement_html: html, updated_at: new Date().toISOString() }).eq('id', agreementId);

    res.json({ html, agreement_id: agreementId, message: 'Agreement document generated successfully', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Get agreement document HTML
router.get('/:id/document', async (req, res) => {
  try {
    const { data, error } = await supabase.from('agreements').select('agreement_html').eq('id', req.params.id).single();
    if (error || !data?.agreement_html) return res.status(404).json({ message: 'Agreement document not found. Generate it first.', success: false });
    res.json({ html: data.agreement_html, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Update agreement fillable fields
router.put('/:id/update-fields', async (req, res) => {
  try {
    const { duration, payment_terms, special_conditions, additional_terms, agreement_text } = req.body;
    const updates = {};
    if (duration !== undefined) updates.duration = duration;
    if (payment_terms !== undefined) updates.payment_terms = payment_terms;
    if (special_conditions !== undefined) updates.special_conditions = special_conditions;
    if (additional_terms !== undefined) updates.additional_terms = additional_terms;
    if (agreement_text !== undefined) updates.agreement_text = agreement_text;

    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'No fields to update', success: false });

    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('agreements').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Agreement fields updated successfully', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Sign agreement
router.put('/:id/sign', async (req, res) => {
  try {
    const { user_id, signature_data } = req.body;
    if (!signature_data) return res.status(400).json({ message: 'Signature data is required', success: false });

    const { data: agreement } = await supabase.from('agreements').select('*').eq('id', req.params.id).single();
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const isOwner = String(agreement.owner_id) === String(user_id);
    const isCustomer = String(agreement.customer_id) === String(user_id);
    if (!isOwner && !isCustomer) return res.status(403).json({ message: 'Only agreement parties can sign', success: false });

    const now = new Date().toISOString();
    const signUpdate = isOwner
      ? { owner_signature: signature_data, owner_signed_at: now, updated_at: now }
      : { customer_signature: signature_data, customer_signed_at: now, updated_at: now };

    await supabase.from('agreements').update(signUpdate).eq('id', req.params.id);

    const { data: updated } = await supabase.from('agreements').select('owner_signature, customer_signature').eq('id', req.params.id).single();
    if (updated?.owner_signature && updated?.customer_signature) {
      await supabase.from('agreements').update({ status: 'active', updated_at: now }).eq('id', req.params.id);
    }

    const notifyUserId = isOwner ? agreement.customer_id : agreement.owner_id;
    const signerName = isOwner ? 'Owner' : 'Customer';
    if (notifyUserId) {
      await supabase.from('notifications').insert({ user_id: notifyUserId, title: 'Agreement Signed', message: `The ${signerName} has signed agreement #${req.params.id}.`, type: 'success' });
    }

    res.json({ message: `Agreement signed by ${signerName} successfully`, success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Send agreement to other party
router.post('/:id/send', async (req, res) => {
  try {
    const { sender_id } = req.body;

    const { data: agreement } = await supabase
      .from('agreements')
      .select('*, properties(title)')
      .eq('id', req.params.id).single();
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const isOwner = String(agreement.owner_id) === String(sender_id);
    const recipientId = isOwner ? agreement.customer_id : agreement.owner_id;
    if (!recipientId) return res.status(400).json({ message: 'No recipient found', success: false });

    const propertyTitle = agreement.properties?.title || 'Property';
    const { data: sender } = await supabase.from('users').select('name').eq('id', sender_id).single();

    await supabase.from('notifications').insert({ user_id: recipientId, title: 'Agreement Document Sent', message: `An agreement document for "${propertyTitle}" has been sent to you for review and signing.`, type: 'info', related_id: req.params.id });
    await supabase.from('messages').insert({ sender_id, receiver_id: recipientId, subject: `Agreement Document - ${propertyTitle}`, message: `${sender?.name || 'A party'} has sent you the agreement document for "${propertyTitle}". Please review and sign.`, message_type: 'property', is_read: false, is_group: false });

    if (agreement.status === 'draft') {
      await supabase.from('agreements').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', req.params.id);
    }

    res.json({ message: 'Agreement sent successfully', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Update agreement status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, signed_by_customer_id } = req.body;
    await supabase.from('agreements').update({ status, updated_at: new Date().toISOString() }).eq('id', req.params.id);

    if (signed_by_customer_id) {
      const { data: agreement } = await supabase.from('agreements').select('owner_id, broker_id, property_id').eq('id', req.params.id).single();
      const recipient = agreement?.owner_id || agreement?.broker_id;
      if (recipient) {
        await supabase.from('notifications').insert({ user_id: recipient, title: 'Agreement Signed', message: `Customer signed agreement #${req.params.id} for property ${agreement.property_id}.`, type: 'success' });
      }
    }

    res.json({ message: 'Agreement status updated', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

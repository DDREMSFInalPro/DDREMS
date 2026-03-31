const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

const getAgreement = async (id) => {
  const { data } = await supabase.from('agreement_requests').select('*').eq('id', id).single();
  return data;
};

const notifyAgreement = async (agreementId, recipientId, type, title, message) => {
  await supabase.from('agreement_notifications').insert({ agreement_id: agreementId, recipient_id: recipientId, notification_type: type, notification_title: title, notification_message: message });
};

// Generate agreement
router.post('/:agreementId/generate', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    await supabase.from('agreement_requests').update({ status: 'generated', updated_at: new Date().toISOString() }).eq('id', agreementId);
    await notifyAgreement(agreementId, agreement.customer_id, 'agreement_generated', 'Agreement Generated', 'Your agreement has been generated. Please review and submit payment.');

    res.json({ success: true, message: 'Agreement generated successfully', status: 'generated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Submit payment
router.post('/:agreementId/submit-payment', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { payment_method, payment_amount, receipt_file_path } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    await supabase.from('agreement_payments').insert({ agreement_id: agreementId, payment_method, payment_amount, receipt_file_path });
    await supabase.from('agreement_requests').update({ status: 'payment_submitted', updated_at: new Date().toISOString() }).eq('id', agreementId);
    await notifyAgreement(agreementId, agreement.owner_id, 'payment_submitted', 'Payment Submitted', `Customer has submitted payment for agreement #${agreementId}`);

    res.json({ success: true, message: 'Payment submitted successfully', status: 'payment_submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Upload receipt
router.post('/:agreementId/upload-receipt', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { receipt_file_path, receipt_file_name } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    await supabase.from('agreement_payments').update({ receipt_file_path, receipt_file_name, receipt_uploaded_date: new Date().toISOString() }).eq('agreement_id', agreementId).order('payment_date', { ascending: false }).limit(1);
    await notifyAgreement(agreementId, agreement.owner_id, 'receipt_uploaded', 'Receipt Uploaded', `Customer has uploaded receipt for agreement #${agreementId}`);

    res.json({ success: true, message: 'Receipt uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Send agreement
router.post('/:agreementId/send-agreement', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { recipient_id } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const { data: recipient } = await supabase.from('users').select('name').eq('id', recipient_id).single();
    await notifyAgreement(agreementId, recipient_id, 'agreement_sent', 'Agreement Sent', 'An agreement has been sent to you for review and signature.');

    res.json({ success: true, message: `Agreement sent to ${recipient?.name || 'recipient'} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Send notification to all parties
router.post('/:agreementId/notify', async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { notification_message } = req.body;
    const agreement = await getAgreement(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found', success: false });

    const recipients = [agreement.customer_id, agreement.owner_id].filter(Boolean);
    await supabase.from('agreement_notifications').insert(recipients.map(id => ({ agreement_id: agreementId, recipient_id: id, notification_type: 'custom_notification', notification_title: 'Agreement Update', notification_message })));

    res.json({ success: true, message: 'Notification sent to all parties' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

// Get agreement notifications
router.get('/:agreementId/notifications', async (req, res) => {
  try {
    const { data, error } = await supabase.from('agreement_notifications').select('*').eq('agreement_id', req.params.agreementId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, notifications: data || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

module.exports = router;

/**
 * Chapa Payment Service
 * Handles Chapa API calls: initialize payment, verify transaction
 * Docs: https://developer.chapa.co
 */
const axios = require('axios');

const CHAPA_BASE = 'https://api.chapa.co/v1';
const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const chapaClient = axios.create({
  baseURL: CHAPA_BASE,
  headers: {
    Authorization: `Bearer ${CHAPA_SECRET}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Initialize a Chapa payment
 * Returns { checkout_url, tx_ref }
 */
const initializePayment = async ({ amount, email, firstName, lastName, txRef, callbackUrl, returnUrl, description }) => {
  const payload = {
    amount:        String(amount),
    currency:      'ETB',
    email,
    first_name:    firstName,
    last_name:     lastName,
    tx_ref:        txRef,
    callback_url:  callbackUrl,
    return_url:    returnUrl,
    customization: {
      title:       'DDREMS Property Payment',
      description: description || 'Real estate payment',
    },
  };

  const res = await chapaClient.post('/transaction/initialize', payload);
  if (res.data.status !== 'success') {
    throw new Error(res.data.message || 'Chapa initialization failed');
  }
  return {
    checkoutUrl: res.data.data.checkout_url,
    txRef,
  };
};

/**
 * Verify a Chapa transaction by tx_ref
 * Returns the full transaction data
 */
const verifyTransaction = async (txRef) => {
  const res = await chapaClient.get(`/transaction/verify/${txRef}`);
  if (res.data.status !== 'success') {
    throw new Error(res.data.message || 'Chapa verification failed');
  }
  return res.data.data;
};

module.exports = { initializePayment, verifyTransaction };

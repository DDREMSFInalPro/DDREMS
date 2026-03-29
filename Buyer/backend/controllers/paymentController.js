const { Payment, Property, User, Agreement } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE = 'https://api.chapa.co/v1';
const FRONTEND_URL = process.env.BUYER_FRONTEND_URL || 'http://localhost:5174';
const BACKEND_URL = process.env.BUYER_BACKEND_URL || 'http://localhost:5001';
module.exports = { getBuyerPayments: async()=>{}, submitPayment: async()=>{}, getPaymentByAgreement: async()=>{}, initializeChapaPayment: async()=>{}, verifyChapaReturn: async()=>{}, chapaWebhook: async()=>{} };

/**
 * PDF Generator Utility
 * Generates agreement PDFs using PDFKit
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a rental or sale agreement PDF
 * @param {Object} data - Agreement data
 * @param {string} data.agreementType - 'sale' or 'rental'
 * @param {Object} data.property - Property details
 * @param {Object} data.owner - Owner details
 * @param {string} data.clientName - Client's full name
 * @param {string} data.clientEmail - Client's email
 * @param {string} data.clientPhone - Client's phone
 * @param {string} data.terms - Additional terms
 * @param {string} data.startDate - Agreement start date
 * @param {string} data.endDate - Agreement end date (rental)
 * @param {number} data.monthlyRent - Monthly rent amount (rental)
 * @param {number} data.salePrice - Sale price (sale)
 * @returns {Promise<string>} - Path to generated PDF file
 */
const generateAgreementPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), 'uploads', 'agreements');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = `agreement-${uuidv4()}.pdf`;
      const filepath = path.join(outputDir, filename);
      const doc = new PDFDocument({ margin: 50 });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ---- PDF Content ----

      // Header
      doc.fontSize(20).font('Helvetica-Bold')
        .text('DIRE DAWA REAL ESTATE MANAGEMENT SYSTEM', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16)
        .text(data.agreementType === 'sale' ? 'PROPERTY SALE AGREEMENT' : 'PROPERTY RENTAL AGREEMENT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica')
        .text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

      // Divider
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // Parties section
      doc.fontSize(14).font('Helvetica-Bold').text('1. PARTIES');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Owner (Landlord/Seller): ${data.owner.name}`);
      doc.text(`Email: ${data.owner.email}`);
      doc.moveDown(0.5);
      doc.text(`Client (Tenant/Buyer): ${data.clientName}`);
      if (data.clientEmail) doc.text(`Email: ${data.clientEmail}`);
      if (data.clientPhone) doc.text(`Phone: ${data.clientPhone}`);
      doc.moveDown(1);

      // Property details section
      doc.fontSize(14).font('Helvetica-Bold').text('2. PROPERTY DETAILS');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Title: ${data.property.title}`);
      doc.text(`Type: ${data.property.propertyType}`);
      doc.text(`Address: ${data.property.address}, ${data.property.city}`);
      doc.text(`Size: ${data.property.sizeSqm || 'N/A'} sqm`);
      doc.text(`Bedrooms: ${data.property.bedrooms} | Bathrooms: ${data.property.bathrooms}`);
      doc.moveDown(1);

      // Financial terms section
      doc.fontSize(14).font('Helvetica-Bold').text('3. FINANCIAL TERMS');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');

      if (data.agreementType === 'rental') {
        doc.text(`Monthly Rent: ETB ${Number(data.monthlyRent || data.property.price).toLocaleString()}`);
        doc.text(`Lease Start Date: ${data.startDate || 'To be determined'}`);
        doc.text(`Lease End Date: ${data.endDate || 'To be determined'}`);
      } else {
        doc.text(`Sale Price: ETB ${Number(data.salePrice || data.property.price).toLocaleString()}`);
        doc.text(`Closing Date: ${data.startDate || 'To be determined'}`);
      }
      doc.moveDown(1);

      // Terms and conditions
      doc.fontSize(14).font('Helvetica-Bold').text('4. TERMS AND CONDITIONS');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      if (data.terms) {
        doc.text(data.terms);
      } else {
        if (data.agreementType === 'rental') {
          doc.text('a) The tenant agrees to pay rent on or before the 5th of each month.');
          doc.text('b) The tenant shall maintain the property in good condition.');
          doc.text('c) Any damages beyond normal wear and tear shall be the tenant\'s responsibility.');
          doc.text('d) Either party may terminate this agreement with 30 days written notice.');
          doc.text('e) The tenant shall not sublet or assign this lease without written consent.');
        } else {
          doc.text('a) The buyer agrees to pay the full purchase price as specified above.');
          doc.text('b) The seller warrants clear title to the property.');
          doc.text('c) All taxes and fees related to the transfer shall be shared equally.');
          doc.text('d) Possession shall be transferred upon receipt of full payment.');
          doc.text('e) This agreement is binding upon execution by both parties.');
        }
      }
      doc.moveDown(1.5);

      // Signature section
      doc.fontSize(14).font('Helvetica-Bold').text('5. SIGNATURES');
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica');

      // Owner signature line
      doc.text('_________________________________');
      doc.text(`Owner: ${data.owner.name}`);
      doc.text('Date: _______________');
      doc.moveDown(1);

      // Client signature line
      doc.text('_________________________________');
      doc.text(`Client: ${data.clientName}`);
      doc.text('Date: _______________');
      doc.moveDown(1.5);

      // Footer
      doc.fontSize(8).font('Helvetica')
        .text('This document was generated by the Dire Dawa Real Estate Management System (DDREMS).', { align: 'center' });
      doc.text('This is a legally binding agreement upon execution by all parties.', { align: 'center' });

      // Finalize
      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/agreements/${filename}`);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateAgreementPDF };

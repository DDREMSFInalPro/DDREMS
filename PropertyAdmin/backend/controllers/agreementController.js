/**
 * Agreement Controller (Admin Module)
 * Full agreement lifecycle management:
 *   - List all agreements with filters
 *   - View agreement details
 *   - Generate PDF for owner_approved agreements
 *   - Add admin notes
 */
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const {
  Agreement,
  Property,
  User,
  PropertyImage,
  NegotiationHistory,
  Payment,
} = require("../models");

/**
 * GET /api/agreements
 * List all agreements with optional filters
 */
const getAgreements = async (req, res, next) => {
  try {
    const {
      status,
      agreementType,
      search,
      sortBy = "createdAt",
      sortOrder = "DESC",
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (agreementType) where.agreementType = agreementType;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Agreement.findAndCountAll({
      where,
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "address", "price", "listingType"],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        agreements: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/agreements/:id
 */
const getAgreementById = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [
        {
          model: Property,
          as: "property",
          include: [
            {
              model: PropertyImage,
              as: "images",
              attributes: ["id", "imageUrl", "isPrimary"],
            },
          ],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "phone", "address"],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "phone", "address"],
        },
      ],
    });

    if (!agreement) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    }

    // Fetch negotiation history separately
    const negotiationHistory = await NegotiationHistory.findAll({
      where: { agreementId: req.params.id },
      order: [["created_at", "ASC"]],
    });

    // Add negotiation history to agreement object
    const agreementData = agreement.toJSON();
    agreementData.negotiationHistory = negotiationHistory;

    res.json({ success: true, data: agreementData });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/agreements/:id/note
 * Add admin note to an agreement
 */
const addAdminNote = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    }

    const { adminNote } = req.body;
    agreement.adminNote = adminNote;
    await agreement.save();

    res.json({
      success: true,
      message: "Admin note updated.",
      data: agreement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/agreements/:id/generate-pdf
 * Generate agreement PDF (only for owner_approved agreements)
 */
const generatePDF = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [
        { model: Property, as: "property" },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "phone", "address"],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "phone", "address"],
        },
      ],
    });

    if (!agreement) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    }

    if (agreement.status !== "payment_verified") {
      return res.status(400).json({
        success: false,
        message: "PDF can only be generated after admin verifies the payment.",
      });
    }

    // Create agreements directory
    const pdfDir = path.join(__dirname, "..", "uploads", "agreements");
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const pdfFilename = `agreement-${agreement.id}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFilename);
    const pdfUrl = `/uploads/agreements/${pdfFilename}`;

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text("DDREMS", { align: "center" });
    doc
      .fontSize(14)
      .text("Dire Dawa Real Estate Management System", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(16)
      .text(
        `${agreement.agreementType === "sale" ? "Sale" : "Rental"} Agreement`,
        { align: "center" },
      );
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Agreement ID & Date
    doc.fontSize(10).font("Helvetica").text(`Agreement ID: ${agreement.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Property Details
    doc.fontSize(12).font("Helvetica-Bold").text("Property Details");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Title: ${agreement.property.title}`);
    doc.text(
      `Address: ${agreement.property.address}, ${agreement.property.city || "Dire Dawa"}`,
    );
    doc.text(
      `Type: ${agreement.property.propertyType} (${agreement.property.listingType})`,
    );
    doc.text(`Price: ETB ${Number(agreement.property.price).toLocaleString()}`);
    doc.moveDown();

    // Owner Details
    doc.fontSize(12).font("Helvetica-Bold").text("Property Owner");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${agreement.owner.name}`);
    doc.text(`Email: ${agreement.owner.email}`);
    if (agreement.owner.phone) doc.text(`Phone: ${agreement.owner.phone}`);
    doc.moveDown();

    // Buyer Details
    doc.fontSize(12).font("Helvetica-Bold").text("Buyer");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${agreement.buyer.name}`);
    doc.text(`Email: ${agreement.buyer.email}`);
    if (agreement.buyer.phone) doc.text(`Phone: ${agreement.buyer.phone}`);
    doc.moveDown();

    // Agreement Terms
    doc.fontSize(12).font("Helvetica-Bold").text("Agreement Terms");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Type: ${agreement.agreementType}`);
    if (agreement.agreementType === "rental") {
      if (agreement.monthlyRent)
        doc.text(
          `Monthly Rent: ETB ${Number(agreement.monthlyRent).toLocaleString()}`,
        );
      if (agreement.startDate) doc.text(`Start Date: ${agreement.startDate}`);
      if (agreement.endDate) doc.text(`End Date: ${agreement.endDate}`);
    } else {
      if (agreement.salePrice)
        doc.text(
          `Sale Price: ETB ${Number(agreement.salePrice).toLocaleString()}`,
        );
    }
    if (agreement.terms) {
      doc.moveDown(0.5);
      doc.text(`Additional Terms: ${agreement.terms}`);
    }
    doc.moveDown(2);

    // Signatures
    doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
    doc.text("Owner Signature", 50, doc.y + 5);
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
    doc.text("Buyer Signature", 50, doc.y + 5);
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
    doc.text("Admin Authorized By", 50, doc.y + 5);

    doc.end();

    await new Promise((resolve) => stream.on("finish", resolve));

    // Update agreement with PDF URL and mark as completed
    agreement.pdfUrl = pdfUrl;
    agreement.status = "completed";
    await agreement.save();

    // Mark property as sold or rented
    const newPropertyStatus = agreement.agreementType === "sale" ? "sold" : "rented";
    await agreement.property.update({ status: newPropertyStatus, isPublished: false });

    res.json({
      success: true,
      message: "Agreement PDF generated and agreement completed.",
      data: {
        id: agreement.id,
        pdfUrl: agreement.pdfUrl,
        status: agreement.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/agreements/:id/forward
 * Admin forwards a pending agreement to the property owner for review
 */
const forwardToOwner = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [
        { model: Property, as: "property", attributes: ["id", "title"] },
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
      ],
    });

    if (!agreement) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    }

    if (agreement.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending agreements can be forwarded to the owner.",
      });
    }

    agreement.status = "forwarded_to_owner";
    agreement.forwardedAt = new Date();
    if (req.body.adminNote) {
      agreement.adminNote = req.body.adminNote;
    }
    await agreement.save();

    res.json({
      success: true,
      message: `Agreement forwarded to owner (${agreement.owner.name}) for review.`,
      data: { id: agreement.id, status: agreement.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/agreements/:id/send-counter-offer
 * Admin reviews a counter-offer from the owner and sends it to the buyer
 */
const sendCounterOfferToBuyer = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [
        { model: Property, as: "property", attributes: ["id", "title"] },
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
      ],
    });

    if (!agreement) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    }

    if (agreement.status !== "counter_offer") {
      return res.status(400).json({
        success: false,
        message: "Only counter-offer agreements can be sent to the buyer.",
      });
    }

    if (req.body.adminNote) {
      agreement.adminNote = req.body.adminNote;
    }
    agreement.status = "counter_offer_sent";
    await agreement.save();

    res.json({
      success: true,
      message: `Counter-offer of ETB ${Number(agreement.counterOfferPrice).toLocaleString()} sent to buyer (${agreement.buyer.name}).`,
      data: { id: agreement.id, status: agreement.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/agreements/:id/forward-buyer-counter
 * Admin forwards buyer's counter-offer back to the owner
 */
const forwardBuyerCounterToOwner = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [
        { model: Property, as: "property", attributes: ["id", "title"] },
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
      ],
    });

    if (!agreement) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    }

    if (agreement.status !== "buyer_counter_offer") {
      return res.status(400).json({
        success: false,
        message: "Only buyer counter-offers can be forwarded to the owner.",
      });
    }

    // Change status to indicate it's been forwarded to owner
    agreement.status = "buyer_counter_forwarded";
    agreement.forwardedAt = new Date();
    if (req.body.adminNote) {
      agreement.adminNote = req.body.adminNote;
    }
    await agreement.save();

    res.json({
      success: true,
      message: `Buyer's counter-offer of ETB ${Number(agreement.buyerCounterPrice).toLocaleString()} forwarded to owner (${agreement.owner.name}).`,
      data: { id: agreement.id, status: agreement.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/agreements/:id/approve-buyer-acceptance
 * Admin processes buyer's acceptance of counter-offer (moves to owner_approved)
 */
const approveBuyerAcceptance = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [
        { model: Property, as: "property", attributes: ["id", "title"] },
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
      ],
    });

    if (!agreement) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    }

    if (agreement.status !== "buyer_accepted_counter") {
      return res.status(400).json({
        success: false,
        message: "Only buyer-accepted counter-offers can be approved.",
      });
    }

    agreement.status = "owner_approved";
    if (req.body.adminNote) {
      agreement.adminNote = req.body.adminNote;
    }
    await agreement.save();

    res.json({
      success: true,
      message: `Agreement approved. Buyer accepted the counter-offer of ETB ${Number(agreement.counterOfferPrice).toLocaleString()}.`,
      data: { id: agreement.id, status: agreement.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/agreements/:id/verify-payment
 * Admin verifies the payment after owner confirms receipt
 */
verifyPayment = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [
        { model: Property, as: "property", attributes: ["id", "title", "address"] },
        { model: User, as: "buyer", attributes: ["id", "name", "email", "phone"] },
        { model: User, as: "owner", attributes: ["id", "name", "email", "phone"] },
      ],
    });
    if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found." });

    if (agreement.status !== "payment_confirmed") {
      return res.status(400).json({ success: false, message: "Payment can only be verified after owner confirms receipt." });
    }

    const payment = await Payment.findOne({
      where: { agreementId: req.params.id },
      order: [["createdAt", "DESC"]],
    });

    // Generate payment receipt PDF
    const receiptDir = path.join(__dirname, "..", "uploads", "agreements");
    if (!fs.existsSync(receiptDir)) fs.mkdirSync(receiptDir, { recursive: true });

    const receiptFilename = `receipt-${agreement.id}.pdf`;
    const receiptPath = path.join(receiptDir, receiptFilename);
    const receiptPdfUrl = `/uploads/agreements/${receiptFilename}`;

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const stream = fs.createWriteStream(receiptPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text("DDREMS", { align: "center" });
    doc.fontSize(12).font("Helvetica").text("Dire Dawa Real Estate Management System", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).font("Helvetica-Bold").text("PAYMENT RECEIPT", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Receipt details
    doc.fontSize(10).font("Helvetica");
    doc.text(`Receipt Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Agreement ID: ${agreement.id}`);
    if (payment) {
      doc.text(`Reference No: ${payment.referenceNumber}`);
      doc.text(`Transaction ID: ${payment.transactionId}`);
    }
    doc.moveDown();

    // Property
    doc.fontSize(12).font("Helvetica-Bold").text("Property");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Title: ${agreement.property?.title}`);
    doc.text(`Address: ${agreement.property?.address}`);
    doc.text(`Agreement Type: ${agreement.agreementType}`);
    doc.moveDown();

    // Parties
    doc.fontSize(12).font("Helvetica-Bold").text("Buyer");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${agreement.buyer?.name}`);
    doc.text(`Email: ${agreement.buyer?.email}`);
    if (agreement.buyer?.phone) doc.text(`Phone: ${agreement.buyer.phone}`);
    doc.moveDown();

    doc.fontSize(12).font("Helvetica-Bold").text("Owner");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${agreement.owner?.name}`);
    doc.text(`Email: ${agreement.owner?.email}`);
    doc.moveDown();

    // Payment info
    doc.fontSize(12).font("Helvetica-Bold").text("Payment Details");
    doc.fontSize(10).font("Helvetica");
    if (payment) {
      doc.text(`Payment Method: ${payment.paymentGateway}`);
      doc.text(`Amount Paid: ETB ${Number(payment.amount).toLocaleString()}`);
      doc.text(`Payment Date: ${new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}`);
      doc.text(`Status: VERIFIED`);
    }
    doc.moveDown(2);

    // Footer
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).text("This receipt confirms that payment has been verified by DDREMS Admin.", { align: "center" });

    doc.end();
    await new Promise((resolve) => stream.on("finish", resolve));

    // Mark payment verified and store receipt URL
    if (payment) {
      await payment.update({
        adminVerified: true,
        adminVerifiedAt: new Date(),
        paymentStatus: "completed",
        receiptUrl: payment.receiptUrl || receiptPdfUrl, // keep buyer receipt if exists
      });
    }

    await agreement.update({ status: "payment_verified" });

    res.json({
      success: true,
      message: "Payment verified. You can now generate the agreement PDF.",
      data: { receiptPdfUrl },
    });
  } catch (error) { next(error); }
}

/**
 * GET /api/agreements/:id/payment
 * Admin gets payment details for an agreement
 */
const getAgreementPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      where: { agreementId: req.params.id },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: payment });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/agreements/:id/ask-owner-payment
 * Admin notifies owner to confirm payment receipt
 */
const askOwnerPaymentConfirmation = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement) return res.status(404).json({ success: false, message: 'Agreement not found.' });

    if (agreement.status !== 'payment_submitted') {
      return res.status(400).json({ success: false, message: 'No submitted payment to verify.' });
    }

    if (req.body.adminNote) agreement.adminNote = req.body.adminNote;
    await agreement.save();

    res.json({ success: true, message: 'Owner has been notified to confirm payment receipt.' });
  } catch (error) { next(error); }
};

module.exports = {
  getAgreements,
  getAgreementById,
  addAdminNote,
  generatePDF,
  forwardToOwner,
  sendCounterOfferToBuyer,
  forwardBuyerCounterToOwner,
  approveBuyerAcceptance,
  getAgreementPayment,
  askOwnerPaymentConfirmation,
  verifyPayment,
};

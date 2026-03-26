/**
 * Property Controller — Unified
 *
 * Role-based access:
 *   buyer  → browse published properties, save/unsave
 *   owner  → CRUD their own properties, toggle publish
 *   admin  → view all properties, toggle publish any
 *
 * Endpoints:
 *   GET    /api/properties              - List (role-filtered)
 *   GET    /api/properties/:id          - Get single property
 *   POST   /api/properties              - Create (owner only)
 *   PUT    /api/properties/:id          - Update (owner only)
 *   DELETE /api/properties/:id          - Soft-delete (owner only)
 *   PATCH  /api/properties/:id/publish  - Toggle publish (owner/admin)
 *
 *   GET    /api/saved                   - Buyer saved list
 *   GET    /api/saved/ids               - Buyer saved IDs
 *   POST   /api/saved/:propertyId       - Save property (buyer)
 *   DELETE /api/saved/:propertyId       - Unsave property (buyer)
 */
const { Op } = require("sequelize");
const { body, param, validationResult } = require("express-validator");
const { Property, PropertyImage, User, SavedProperty } = require("../models");

// ─── Validation ───────────────────────────────────────────────────────────────

const addPropertyValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 }),
  body("description").optional().trim(),
  body("propertyType")
    .isIn(["apartment", "house", "villa", "commercial", "land", "office"])
    .withMessage("Invalid property type"),
  body("listingType")
    .isIn(["sale", "rent"])
    .withMessage("Listing type must be sale or rent"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("sizeSqm").optional().isFloat({ min: 0 }),
  body("bedrooms").optional().isInt({ min: 0 }),
  body("bathrooms").optional().isInt({ min: 0 }),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("city").optional().trim(),
  body("latitude").optional().isFloat({ min: -90, max: 90 }),
  body("longitude").optional().isFloat({ min: -180, max: 180 }),
  body("tourUrl3d").optional().isURL(),
  body("amenities").optional().isArray(),
];

const updatePropertyValidation = [
  param("id").isUUID().withMessage("Invalid property ID"),
  body("title").optional().trim().isLength({ max: 200 }),
  body("description").optional().trim(),
  body("propertyType")
    .optional()
    .isIn(["apartment", "house", "villa", "commercial", "land", "office"]),
  body("listingType").optional().isIn(["sale", "rent"]),
  body("price").optional().isFloat({ min: 0 }),
  body("sizeSqm").optional().isFloat({ min: 0 }),
  body("bedrooms").optional().isInt({ min: 0 }),
  body("bathrooms").optional().isInt({ min: 0 }),
  body("address").optional().trim(),
  body("city").optional().trim(),
  body("latitude").optional().isFloat({ min: -90, max: 90 }),
  body("longitude").optional().isFloat({ min: -180, max: 180 }),
  body("tourUrl3d").optional().isURL(),
  body("amenities").optional().isArray(),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const propertyIncludes = (includeOwner = true) => {
  const inc = [
    {
      model: PropertyImage,
      as: "images",
      attributes: ["id", "imageUrl", "isPrimary", "sortOrder"],
    },
  ];
  if (includeOwner) {
    inc.push({
      model: User,
      as: "owner",
      attributes: ["id", "name", "email", "phone"],
    });
  }
  return inc;
};

const buildSearchWhere = (search) => ({
  [Op.or]: [
    { title: { [Op.iLike]: `%${search}%` } },
    { address: { [Op.iLike]: `%${search}%` } },
    { city: { [Op.iLike]: `%${search}%` } },
    { description: { [Op.iLike]: `%${search}%` } },
  ],
});

// ─── List Properties ──────────────────────────────────────────────────────────

/**
 * GET /api/properties
 * - buyer  → published only, with price/type/city filters
 * - owner  → their own properties, all statuses
 * - admin  → all properties, all filters
 */
const getProperties = async (req, res, next) => {
  try {
    const { role, userId } = req.user;
    const {
      page = 1,
      limit = 12,
      search = "",
      propertyType,
      listingType,
      status,
      isPublished,
      minPrice,
      maxPrice,
      bedrooms,
      city,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Role-based base filter
    if (role === "buyer") {
      where.isPublished = true;
      where.isDeleted = false;
    } else if (role === "owner") {
      where.ownerId = userId;
      // owners see their own deleted too if they want
      if (isPublished !== undefined) where.isPublished = isPublished === "true";
      if (status) where.status = status;
    } else if (role === "admin") {
      // admin sees everything including deleted
      if (isPublished !== undefined) where.isPublished = isPublished === "true";
      if (status) where.status = status;
    }

    // Shared filters
    if (search) Object.assign(where, buildSearchWhere(search));
    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    if (bedrooms) where.bedrooms = { [Op.gte]: parseInt(bedrooms) };

    const allowedSort = ["createdAt", "price", "sizeSqm", "bedrooms", "title"];
    const orderField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
    const orderDir = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { count, rows: properties } = await Property.scope(
      null,
    ).findAndCountAll({
      where,
      include: propertyIncludes(),
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        properties,
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

// ─── Get Single Property ──────────────────────────────────────────────────────

/**
 * GET /api/properties/:id
 * - buyer  → must be published
 * - owner  → must own it
 * - admin  → any property
 */
const getPropertyById = async (req, res, next) => {
  try {
    const { role, userId } = req.user;
    const { id } = req.params;

    const where = { id };
    if (role === "buyer") {
      where.isPublished = true;
      where.isDeleted = false;
    } else if (role === "owner") {
      where.ownerId = userId;
    }

    const property = await Property.scope(null).findOne({
      where,
      include: propertyIncludes(),
    });

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found." });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
};

// ─── Create Property (Owner) ──────────────────────────────────────────────────

const createProperty = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const ownerId = req.user.userId;
    const {
      title,
      description,
      propertyType,
      listingType,
      price,
      sizeSqm,
      bedrooms,
      bathrooms,
      address,
      city,
      latitude,
      longitude,
      tourUrl3d,
      amenities,
    } = req.body;

    const property = await Property.create({
      ownerId,
      title,
      description,
      propertyType,
      listingType,
      price,
      sizeSqm,
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 0,
      address,
      city: city || "Dire Dawa",
      latitude,
      longitude,
      tourUrl3d,
      amenities: amenities || [],
      status: "draft",
    });

    if (req.files && req.files.length > 0) {
      await PropertyImage.bulkCreate(
        req.files.map((file, i) => ({
          propertyId: property.id,
          imageUrl: `/uploads/${file.filename}`,
          isPrimary: i === 0,
          sortOrder: i,
        })),
      );
    }

    const created = await Property.scope(null).findByPk(property.id, {
      include: propertyIncludes(),
    });

    res.status(201).json({
      success: true,
      message: "Property created successfully.",
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Property (Owner) ──────────────────────────────────────────────────

const updateProperty = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const ownerId = req.user.userId;
    const { id } = req.params;

    const property = await Property.scope(null).findOne({
      where: { id, ownerId },
    });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property.",
      });
    }

    const allowed = [
      "title",
      "description",
      "propertyType",
      "listingType",
      "price",
      "sizeSqm",
      "bedrooms",
      "bathrooms",
      "address",
      "city",
      "latitude",
      "longitude",
      "tourUrl3d",
      "amenities",
      "status",
    ];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    await property.update(updateData);

    if (req.files && req.files.length > 0) {
      const existingCount = await PropertyImage.count({
        where: { propertyId: id },
      });
      await PropertyImage.bulkCreate(
        req.files.map((file, i) => ({
          propertyId: id,
          imageUrl: `/uploads/${file.filename}`,
          isPrimary: existingCount === 0 && i === 0,
          sortOrder: existingCount + i,
        })),
      );
    }

    const updated = await Property.scope(null).findByPk(id, {
      include: propertyIncludes(),
    });

    res.json({
      success: true,
      message: "Property updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Property (Owner) ──────────────────────────────────────────────────

const deleteProperty = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const property = await Property.scope(null).findOne({
      where: { id, ownerId },
    });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you do not own this property.",
      });
    }

    await property.update({
      isDeleted: true,
      isPublished: false,
      status: "withdrawn",
    });

    res.json({ success: true, message: "Property deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// ─── Toggle Publish (Owner / Admin) ──────────────────────────────────────────

const togglePublish = async (req, res, next) => {
  try {
    const { role, userId } = req.user;
    const { id } = req.params;

    const where = { id };
    if (role === "owner") where.ownerId = userId;

    const property = await Property.scope(null).findOne({ where });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found." });
    }

    const newPublished = !property.isPublished;
    await property.update({
      isPublished: newPublished,
      status: newPublished ? "active" : "draft",
    });

    res.json({
      success: true,
      message: `Property ${newPublished ? "published" : "unpublished"} successfully.`,
      data: {
        id: property.id,
        isPublished: newPublished,
        status: property.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Property Image (Owner) ───────────────────────────────────────────

const deletePropertyImage = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id, imageId } = req.params;

    // Verify ownership
    const property = await Property.scope(null).findOne({
      where: { id, ownerId },
    });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found." });
    }

    const image = await PropertyImage.findOne({
      where: { id: imageId, propertyId: id },
    });
    if (!image) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found." });
    }

    await image.destroy();
    res.json({ success: true, message: "Image deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// ─── Saved Properties (Buyer) ─────────────────────────────────────────────────

const getSavedProperties = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await SavedProperty.findAndCountAll({
      where: { buyerId },
      include: [
        {
          model: Property,
          as: "property",
          include: propertyIncludes(),
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        savedProperties: rows,
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

const getSavedPropertyIds = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const saved = await SavedProperty.findAll({
      where: { buyerId },
      attributes: ["propertyId"],
      raw: true,
    });
    res.json({
      success: true,
      data: { savedIds: saved.map((s) => s.propertyId) },
    });
  } catch (error) {
    next(error);
  }
};

const saveProperty = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { propertyId } = req.params;

    const property = await Property.scope(null).findOne({
      where: { id: propertyId, isPublished: true, isDeleted: false },
    });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or not available.",
      });
    }

    const existing = await SavedProperty.findOne({
      where: { buyerId, propertyId },
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Property already saved." });
    }

    await SavedProperty.create({ buyerId, propertyId });
    res
      .status(201)
      .json({ success: true, message: "Property saved successfully." });
  } catch (error) {
    next(error);
  }
};

const unsaveProperty = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { propertyId } = req.params;

    const saved = await SavedProperty.findOne({
      where: { buyerId, propertyId },
    });
    if (!saved) {
      return res
        .status(404)
        .json({ success: false, message: "Saved property not found." });
    }

    await saved.destroy();
    res.json({ success: true, message: "Property removed from saved list." });
  } catch (error) {
    next(error);
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  togglePublish,
  deletePropertyImage,
  getSavedProperties,
  getSavedPropertyIds,
  saveProperty,
  unsaveProperty,
  addPropertyValidation,
  updatePropertyValidation,
};

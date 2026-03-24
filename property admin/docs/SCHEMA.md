# Database Schema

MongoDB database: `ddrems`

---

## User

Collection: `users`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `name` | String | Yes | Full name |
| `email` | String | Yes, unique | Login email (lowercase) |
| `password` | String | Yes | bcrypt hash (min 6 chars) |
| `phone` | String | No | Contact number |
| `role` | String | Yes | `admin` \| `owner` \| `broker` |
| `isActive` | Boolean | — | Default `true`. Set to `false` to disable login |
| `profileImage` | String | No | URL to profile photo |
| `licenseNumber` | String | No | Broker license number |
| `agency` | String | No | Broker agency name |
| `createdAt` | Date | auto | Mongoose timestamp |
| `updatedAt` | Date | auto | Mongoose timestamp |

**Notes:**
- Password is hashed via a `pre('save')` hook using bcryptjs (cost factor 10)
- `comparePassword(candidate)` instance method returns a Promise<boolean>
- Only `owner` and `broker` roles can self-register; `admin` must be seeded

---

## Property

Collection: `properties`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `title` | String | Yes | Property listing title |
| `description` | String | No | Full description |
| `owner` | ObjectId → User | Yes | Property owner |
| `broker` | ObjectId → User | No | Assigned broker |
| `address.street` | String | No | Street address |
| `address.city` | String | No | City |
| `address.state` | String | No | State/region |
| `address.country` | String | No | Country |
| `address.zipCode` | String | No | Postal code |
| `type` | String | Yes | `residential` \| `commercial` \| `land` \| `industrial` |
| `listingType` | String | Yes | `sale` \| `rental` (default: `sale`) |
| `price` | Number | Yes | Sale price or monthly rent in ETB |
| `size` | Number | No | Area in sq ft |
| `bedrooms` | Number | No | Number of bedrooms |
| `bathrooms` | Number | No | Number of bathrooms |
| `saleDate` | Date | No | Date of sale (sale listings) |
| `tenant` | ObjectId → User | No | Current tenant (rental listings) |
| `leaseStartDate` | Date | No | Lease start (rental listings) |
| `leaseEndDate` | Date | No | Lease end (rental listings) |
| `isRented` | Boolean | — | Default `false` |
| `documents` | [Document] | — | Embedded document array |
| `verificationStatus` | String | — | `PENDING` \| `IN_REVIEW` \| `VERIFIED` \| `REJECTED` (default: `PENDING`) |
| `verifiedBy` | ObjectId → User | No | Admin who reviewed |
| `verificationDate` | Date | No | When review was completed |
| `verificationNotes` | String | No | Admin notes from review |
| `isActive` | Boolean | — | Default `true` |
| `images` | [String] | — | Array of image URLs |
| `createdAt` | Date | auto | Mongoose timestamp |
| `updatedAt` | Date | auto | Mongoose timestamp |

### Embedded: Document

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Sub-document ID |
| `documentType` | String | Yes | `title_deed` \| `floor_plan` \| `survey` \| `tax_certificate` \| `other` |
| `url` | String | Yes | File URL |
| `verificationStatus` | String | — | `PENDING` \| `VERIFIED` \| `REJECTED` (default: `PENDING`) |
| `uploadedAt` | Date | — | Default `Date.now` |

---

## VerificationAudit

Collection: `verificationaudits`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `property` | ObjectId → Property | Yes | The property being audited |
| `performedBy` | ObjectId → User | Yes | Admin who performed the action |
| `actionType` | String | Yes | See action types below |
| `previousStatus` | String | No | Status before the action |
| `newStatus` | String | No | Status after the action |
| `notes` | String | No | Admin notes or rejection reason |
| `ipAddress` | String | No | Request IP address |
| `timestamp` | Date | — | Default `Date.now` |

**Action Types:**
| Value | Triggered when |
|-------|---------------|
| `SUBMITTED` | Owner submits property for review |
| `IN_REVIEW` | Admin starts reviewing |
| `VERIFIED` | Admin approves the property |
| `REJECTED` | Admin rejects the property |
| `DOCUMENT_ADDED` | A document is uploaded |
| `DOCUMENT_VERIFIED` | A document is marked verified |
| `DOCUMENT_REJECTED` | A document is marked rejected |
| `NOTES_UPDATED` | Admin updates review notes |

**Indexes:**
- `{ property: 1, timestamp: -1 }` — for fast audit log queries per property

---

## Entity Relationships

```
User (admin)
  │
  ├─ verifiedBy ──────────────────────────────┐
  │                                           │
User (owner) ──── owner ──── Property ────────┤
  │                              │            │
User (broker) ── broker ─────────┘            │
  │                              │            │
User (tenant) ── tenant ─────────┘            │
                                              │
                         VerificationAudit ───┘
                           performedBy → User (admin)
                           property    → Property
```

# API Reference

Base URL (development): `http://localhost:5000/api`

All protected endpoints require the header:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication

### POST /auth/register
Create a new owner or broker account. Admin accounts must be created via the seed script.

**Request**
```json
{
  "name": "Abebe Kebede",
  "email": "abebe@example.com",
  "password": "secret123",
  "role": "owner",
  "phone": "+251911000000"
}
```

**Response 201**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "Abebe Kebede",
    "email": "abebe@example.com",
    "role": "owner"
  }
}
```

**Errors**
| Status | Message |
|--------|---------|
| 400 | Name, email, and password are required |
| 409 | Email already in use |

---

### POST /auth/login

**Request**
```json
{
  "email": "admin@ddrems.com",
  "password": "Admin@1234"
}
```

**Response 200**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "System Admin",
    "email": "admin@ddrems.com",
    "role": "admin"
  }
}
```

**Errors**
| Status | Message |
|--------|---------|
| 400 | Email and password are required |
| 401 | Invalid credentials |

---

### GET /auth/me
Returns the currently authenticated user.

**Response 200**
```json
{
  "user": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "System Admin",
    "email": "admin@ddrems.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2025-01-15T08:00:00.000Z"
  }
}
```

---

## Verification Endpoints
> All require `Authorization` header and `admin` role.

### GET /verification/pending
Returns all properties with `PENDING` status.

**Query params:** none

**Response 200**
```json
{
  "count": 2,
  "properties": [
    {
      "_id": "664b...",
      "title": "3-Bedroom House in Kezira",
      "type": "residential",
      "price": 2500000,
      "verificationStatus": "PENDING",
      "createdAt": "2025-03-01T10:00:00.000Z",
      "owner": {
        "name": "Abebe Kebede",
        "email": "abebe@example.com",
        "phone": "+251911000000"
      }
    }
  ]
}
```

---

### GET /verification/property/:id
Returns full property details for review.

**Response 200**
```json
{
  "property": {
    "_id": "664b...",
    "title": "3-Bedroom House in Kezira",
    "type": "residential",
    "listingType": "sale",
    "price": 2500000,
    "address": {
      "street": "Kezira Road 12",
      "city": "Dire Dawa",
      "state": "Dire Dawa",
      "country": "Ethiopia"
    },
    "bedrooms": 3,
    "bathrooms": 2,
    "size": 180,
    "verificationStatus": "PENDING",
    "documents": [
      {
        "_id": "664c...",
        "documentType": "title_deed",
        "url": "https://storage.example.com/docs/deed.pdf",
        "verificationStatus": "PENDING"
      }
    ],
    "owner": { "name": "Abebe Kebede", "email": "abebe@example.com", "phone": "+251911000000" },
    "broker": null,
    "createdAt": "2025-03-01T10:00:00.000Z"
  }
}
```

**Errors**
| Status | Message |
|--------|---------|
| 404 | Property not found |

---

### POST /verification/approve

**Request**
```json
{
  "propertyId": "664b...",
  "notes": "All documents verified. Title deed confirmed."
}
```

**Response 200**
```json
{
  "message": "Property approved successfully",
  "property": {
    "_id": "664b...",
    "verificationStatus": "VERIFIED",
    "verifiedBy": "664a...",
    "verificationDate": "2025-03-10T09:30:00.000Z",
    "verificationNotes": "All documents verified. Title deed confirmed."
  }
}
```

**Errors**
| Status | Message |
|--------|---------|
| 400 | propertyId is required |
| 400 | Property is already verified |
| 404 | Property not found |

---

### POST /verification/reject

**Request**
```json
{
  "propertyId": "664b...",
  "notes": "Title deed does not match the property address on file."
}
```

**Response 200**
```json
{
  "message": "Property rejected",
  "property": {
    "_id": "664b...",
    "verificationStatus": "REJECTED",
    "verificationNotes": "Title deed does not match the property address on file."
  }
}
```

**Errors**
| Status | Message |
|--------|---------|
| 400 | propertyId and notes (rejection reason) are required |
| 400 | Property is already rejected |
| 404 | Property not found |

---

### POST /verification/document/verify

**Request**
```json
{
  "propertyId": "664b...",
  "documentId": "664c...",
  "status": "VERIFIED",
  "notes": "Document is authentic"
}
```

**Response 200**
```json
{
  "message": "Document verified",
  "document": {
    "_id": "664c...",
    "documentType": "title_deed",
    "verificationStatus": "VERIFIED"
  }
}
```

---

### GET /verification/history/:id
Returns the full audit trail for a property.

**Response 200**
```json
{
  "property": { "_id": "664b...", "title": "3-Bedroom House in Kezira", "verificationStatus": "VERIFIED" },
  "history": [
    {
      "_id": "664d...",
      "actionType": "VERIFIED",
      "previousStatus": "IN_REVIEW",
      "newStatus": "VERIFIED",
      "notes": "All documents verified.",
      "ipAddress": "::1",
      "timestamp": "2025-03-10T09:30:00.000Z",
      "performedBy": { "name": "System Admin", "email": "admin@ddrems.com", "role": "admin" }
    }
  ]
}
```

---

## Reports Endpoints
> All require `Authorization` header and `admin` role.

### Query Parameters (all report endpoints)

| Param | Type | Description |
|-------|------|-------------|
| `startDate` | ISO date string | Filter from this date |
| `endDate` | ISO date string | Filter to this date |
| `propertyType` | string | `residential` \| `commercial` \| `land` \| `industrial` |

---

### GET /reports/sales

**Example:** `GET /reports/sales?startDate=2025-01-01&endDate=2025-03-31`

**Response 200**
```json
{
  "summary": {
    "totalProperties": 12,
    "totalRevenue": 28500000,
    "averagePrice": 2375000
  },
  "byType": [
    { "_id": "residential", "count": 8, "totalRevenue": 18000000, "averagePrice": 2250000 },
    { "_id": "commercial",  "count": 4, "totalRevenue": 10500000, "averagePrice": 2625000 }
  ],
  "byMonth": [
    { "_id": { "year": 2025, "month": 1 }, "count": 4, "totalRevenue": 9000000 },
    { "_id": { "year": 2025, "month": 2 }, "count": 5, "totalRevenue": 11500000 }
  ],
  "properties": [ /* full property objects */ ]
}
```

---

### GET /reports/rentals

**Response 200**
```json
{
  "summary": {
    "totalProperties": 20,
    "activeRentals": 15,
    "totalMonthlyIncome": 75000,
    "averageRent": 5000
  },
  "byType": [ /* same shape as sales */ ],
  "byMonth": [ /* keyed on leaseStartDate */ ],
  "properties": [ /* includes tenant, leaseStartDate, leaseEndDate */ ]
}
```

---

### GET /reports/verification-stats

**Response 200**
```json
{
  "summary": {
    "total": 45,
    "PENDING": 8,
    "IN_REVIEW": 3,
    "VERIFIED": 30,
    "REJECTED": 4,
    "verificationRate": "66.67%",
    "avgVerificationTimeHours": "18.40h"
  }
}
```

---

## Error Response Format

All errors follow this shape:
```json
{
  "message": "Human-readable error description"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Bad request / validation error |
| 401 | Missing or invalid token |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 500 | Internal server error |

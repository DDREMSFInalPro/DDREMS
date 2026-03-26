# DDREMS Backend - JSON File-Based API

A simple Express.js backend using JSON files for data persistence.

## Installation

```bash
npm install
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/properties/owner/:ownerId` - Get properties by owner

### Buyers
- `GET /api/buyers` - Get all buyers
- `GET /api/buyers/:id` - Get buyer by ID
- `POST /api/buyers` - Create new buyer
- `PUT /api/buyers/:id` - Update buyer
- `DELETE /api/buyers/:id` - Delete buyer

### Owners
- `GET /api/owners` - Get all owners
- `GET /api/owners/:id` - Get owner by ID
- `POST /api/owners` - Create new owner
- `PUT /api/owners/:id` - Update owner
- `DELETE /api/owners/:id` - Delete owner
- `POST /api/owners/:id/properties` - Add property to owner
- `POST /api/owners/:id/documents` - Add document to owner

### Agreements
- `GET /api/agreements` - Get all agreements
- `GET /api/agreements/:id` - Get agreement by ID
- `POST /api/agreements` - Create new agreement
- `PUT /api/agreements/:id` - Update agreement
- `DELETE /api/agreements/:id` - Delete agreement
- `GET /api/agreements/status/:status` - Get agreements by status
- `GET /api/agreements/buyer/:buyerId` - Get agreements by buyer
- `GET /api/agreements/owner/:ownerId` - Get agreements by owner

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get document by ID
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/owner/:ownerId` - Get documents by owner
- `GET /api/documents/property/:propertyId` - Get documents by property
- `GET /api/documents/status/:status` - Get documents by status

## Data Storage

All data is stored in JSON files in the `data/` directory:
- `users.json` - User accounts
- `properties.json` - Property listings
- `buyers.json` - Buyer profiles
- `owners.json` - Property owner profiles
- `agreements.json` - Property agreements
- `documents.json` - Property documents

## Default Login

Email: `admin@ddrems.com`
Password: `admin123`

## Environment Variables

- `PORT` - Server port (default: 5000)

## Technologies

- Express.js 5.0
- CORS
- Body Parser
- jsonfile
- UUID

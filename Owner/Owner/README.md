# DDREMS Owner Module

The **Owner Module** for the Dire Dawa Real Estate Management System (DDREMS). A full-stack web application enabling property owners to manage their real estate portfolio.

## Features

- **Dashboard** — Overview with property counts, active listings, payments, revenue
- **Property Management** — Add, edit, soft-delete, publish/unpublish properties
- **Image Upload** — Multi-file upload for property images (JPEG, PNG, WebP)
- **AI Price Recommendation** — Get AI-suggested pricing based on property attributes
- **Payments Tracking** — View all received payments with search and filters
- **Agreement Generation** — Generate rental/sale agreement PDFs for download
- **Profile Management** — View and edit owner profile with password change
- **Authentication** — JWT-based login/register with role-based access control
- **Responsive Design** — Works on desktop, tablet, and mobile devices

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Axios |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | PostgreSQL with PostGIS |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File Upload | Multer |
| PDF Generation | PDFKit |
| AI Service | External microservice (axios) |

## Project Structure

```
Owner/
├── backend/           # Express.js REST API
│   ├── config/        # Database configuration
│   ├── controllers/   # Route handlers
│   ├── middleware/     # Auth, RBAC, error handling, upload
│   ├── models/        # Sequelize models
│   ├── routes/        # Express route definitions
│   ├── services/      # AI price service
│   ├── utils/         # PDF generator
│   ├── app.js         # Express app setup
│   └── server.js      # Entry point
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/  # Layout, Sidebar, Navbar, ProtectedRoute
│       ├── context/     # AuthContext
│       ├── pages/       # All page components
│       └── services/    # API client (axios)
├── database/          # PostgreSQL schema
│   └── schema.sql
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 14+ (with PostGIS extension)
- npm or yarn

### 1. Database Setup

```bash
# Create database
createdb ddrems

# Run schema
psql -d ddrems -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file and update values
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Install dependencies
npm install

# Create uploads directory
mkdir -p uploads/agreements

# Start server
npm run dev
```

The API will run on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will run on `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/dashboard` | Owner dashboard | ✅ owner |
| GET | `/api/properties/owner` | List properties | ✅ owner |
| GET | `/api/properties/:id` | Get property | ✅ owner |
| POST | `/api/properties` | Add property | ✅ owner |
| PUT | `/api/properties/:id` | Update property | ✅ owner |
| DELETE | `/api/properties/:id` | Soft-delete | ✅ owner |
| POST | `/api/properties/:id/publish` | Toggle publish | ✅ owner |
| GET | `/api/payments/owner` | List payments | ✅ owner |
| POST | `/api/agreements/generate` | Generate PDF | ✅ owner |
| GET | `/api/agreements` | List agreements | ✅ owner |
| GET | `/api/price-recommendation` | AI pricing | ✅ owner |
| GET | `/api/profile` | Get profile | ✅ any |
| PUT | `/api/profile` | Update profile | ✅ any |

## Environment Variables

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ddrems
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000/api/predict-price
```

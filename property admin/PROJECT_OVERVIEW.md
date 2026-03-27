# DDREMS Project Overview

## System Architecture

### Backend (Express.js + JSON Storage)
- RESTful API on port 5000
- File-based JSON database in `backend/data/`
- No external database required
- Auto-initializes with mock data

### Frontend (React + Vite)
- Modern React 19 with Vite
- Material-UI for components
- Redux Toolkit for state management
- Runs on port 5173

## Core Features (16 Pages)

### Authentication & Dashboard
1. **Login** - JWT authentication
2. **Dashboard** - System overview and metrics

### Property Management
3. **Verification** - Review and approve properties
4. **Property Review** - Detailed property inspection
5. **Register Property** - Manual property registration

### Stakeholder Management
6. **Property Owners** - Owner profiles and properties
7. **Buyers** - Buyer profiles and preferences
8. **Renters** - Renter management and rental tracking

### Document & Communication
9. **Document Inbox** - Document verification workflow
10. **Messages** - Admin-owner communication

### Agreements & Compliance
11. **Agreements** - Agreement generation and tracking
12. **Compliance Monitoring** - Regulatory compliance tracking

### Advanced Features
13. **Broker Management** - Broker coordination and performance
14. **Price Recommendations** - AI-powered pricing suggestions
15. **Fraud Alerts** - Fraud detection and management
16. **Reports** - Sales and rental analytics

## Data Models

All stored in `backend/data/*.json`:

- **users.json** - Admin accounts
- **properties.json** - Property listings
- **buyers.json** - Buyer profiles
- **owners.json** - Owner profiles with nested properties/documents
- **renters.json** - Renter profiles with rental history
- **agreements.json** - Property agreements
- **documents.json** - Property documents

## Key Technologies

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Redux Toolkit, Material-UI v7 |
| Backend | Node.js, Express 5 |
| Storage | JSON files |
| Charts | Recharts |
| Export | jsPDF, xlsx |
| i18n | i18next (English, Amharic, Oromo) |

## API Endpoints

### Authentication
- POST `/api/auth/login`
- POST `/api/auth/register`
- GET `/api/auth/me`

### Resources (CRUD)
- `/api/properties`
- `/api/buyers`
- `/api/owners`
- `/api/renters`
- `/api/agreements`
- `/api/documents`

## Development Workflow

1. Start both servers: `npm run dev`
2. Frontend auto-reloads on changes
3. Backend restarts on file changes (nodemon)
4. Data persists in JSON files

## File Structure

```
ddrems-property-admin/
├── backend/
│   ├── routes/              # API endpoints
│   ├── utils/fileDb.js      # JSON database utility
│   ├── data/                # JSON data files
│   └── server.js            # Express app
├── frontend/
│   ├── src/
│   │   ├── pages/          # 16 page components
│   │   ├── components/     # Reusable components
│   │   ├── store/          # Redux store + slices
│   │   ├── locales/        # i18n translations
│   │   └── utils/          # Helper functions
│   └── .env                # Environment config
└── docs/                   # API documentation
```

## State Management

### Redux Slices
- **authSlice** - Authentication and user session
- **verificationSlice** - Property verification workflow
- **reportSlice** - Report generation
- **socketSlice** - Real-time notifications

## Multi-language Support

Supported languages:
- English (en)
- Amharic (am)
- Oromo (om)

Translation files in `frontend/src/locales/`

## Security Features

- JWT authentication
- Session timeout (15 minutes)
- CORS enabled
- Input validation
- Error handling

## Export Capabilities

- PDF export (jsPDF)
- Excel export (xlsx)
- Print functionality

## Mock Data

System includes sample data for:
- 1 admin user
- 8 properties
- 5 buyers
- 4 owners
- 3 renters
- 2 agreements
- Multiple documents

## Production Considerations

Current setup is ideal for:
- Development and testing
- Small-scale deployments
- Prototyping
- Single-server environments

For production scale, consider:
- Migrating to MongoDB/PostgreSQL
- Adding authentication middleware
- Implementing rate limiting
- Setting up proper logging
- Adding backup strategies

## Quick Commands

```bash
# Install everything
npm run install:all

# Start development
npm run dev

# Build for production
npm run build

# Clear all data
rm -rf backend/data/
```

## Default Credentials

- Email: `admin@ddrems.com`
- Password: `admin123`

## Support

- [API Documentation](docs/API.md)
- [Database Schema](docs/SCHEMA.md)
- [Main README](README.md)

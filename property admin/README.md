# DDREMS - Property Administration Portal

A full-stack property management system for Dire Dawa, Ethiopia.

## Quick Start

```bash
# Install dependencies
npm run install:all

# Start both backend and frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Login: `admin@ddrems.com` / `admin123`

## Features

- **Request Management** - Property owners, buyers, and renters submit registration requests
- Property verification and management
- Owner, buyer, and renter management
- Document management and verification
- Agreement generation
- Broker and agent coordination
- AI price recommendations
- Fraud detection alerts
- Compliance monitoring
- Reports and analytics
- Multi-language support (English, Amharic, Oromo)

## Tech Stack

- Frontend: React 19, Vite, Redux Toolkit, Material-UI
- Backend: Node.js, Express, JSON file storage
- Charts: Recharts
- Export: jsPDF, xlsx

## Project Structure

```
ddrems-property-admin/
├── backend/
│   ├── routes/          # API endpoints
│   ├── utils/           # Database utilities
│   ├── data/            # JSON data files
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── store/      # Redux store
│   │   └── locales/    # Translations
│   └── .env            # Environment config
└── docs/               # API documentation
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers in development |
| `npm run install:all` | Install all dependencies |
| `npm run build` | Build frontend for production |

## Documentation

- [API Reference](docs/API.md) - All endpoints with examples
- [Database Schema](docs/SCHEMA.md) - Data models and fields

## Data Storage

All data is stored in JSON files in `backend/data/`:
- users.json
- properties.json
- buyers.json
- owners.json
- renters.json
- agreements.json
- documents.json

Data persists between server restarts.

## Troubleshooting

**Backend won't start:**
```bash
# Check if port 5000 is in use
lsof -i :5000
```

**Frontend can't connect:**
- Verify backend is running: http://localhost:5000/api/health
- Check `frontend/.env` has correct API URL

**Clear all data:**
```bash
rm -rf backend/data/
npm run dev  # Will reinitialize with mock data
```

## Development

Run servers separately:
```bash
# Backend only
npm run dev --prefix backend

# Frontend only
npm run dev --prefix frontend
```

## License

MIT

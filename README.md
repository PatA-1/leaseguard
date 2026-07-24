# LeaseGuard

A structured digital evidence platform for tenancy deposit disputes.

## Tech stack
React + Vite (client), Node.js + Express (server), PostgreSQL + Prisma, Cloudinary

## Setup

### Prerequisites
- Node 18+
- PostgreSQL 15+
- A Cloudinary account

### Install
```bash
cd client && npm install
cd ../server && npm install
```

### Environment variables
Copy `.env.example` to `.env` in the server folder and fill in:

### Database
```bash
cd server
npx prisma migrate reset
npx prisma generate
```

### Run
```bash
cd client && npm run dev
cd server && npm run dev
```

### Tests
```bash
cd server && npm test
```

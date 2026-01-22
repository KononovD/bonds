# Bond Tracker

A full-stack application for tracking bond investments, built with NestJS and React.

## Features
- **Bonds Management**: Add, edit, delete bonds.
- **Payments Schedule**: Manual management of coupon and redemption payments within each bond.
- **Purchases**: Track bond purchases (quantity, price, commission).
- **Dashboard**: View total invested amount, received income, expected income, and upcoming payments.
- **Data Persistence**: All data is stored in `server/data/data.json`.

## Project Structure
- **/server**: NestJS backend application.
  - `src/data`: Handles JSON file I/O using atomic writes.
  - `src/bonds`: CRUD for bonds and their nested payment schedules.
  - `src/purchases`: CRUD for purchase records.
- **/client**: Vite + React frontend application.
  - `src/api`: Axios integration.
  - `src/pages`: UI pages (Dashboard, BondList, BondDetails, etc.).
  - `src/components`: Styled-components.

## Prerequisites
- Node.js (v18+)
- npm

## Installation

1. Install dependencies for root, server, and client:
   ```bash
   npm run install:all
   ```

## Running the Application

To start both the backend and frontend simultaneously in development mode:

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## Data Management
- The data is stored in `server/data/data.json`.
- **Backup**: Simply copy `server/data/data.json` to a safe location.
- **Restore**: Overwrite `server/data/data.json` with your backup.

## Calculations
- **Invested**: Sum of (Quantity * Price + Commission) for all purchases.
- **Expected Income**: Sum of all payments marked as NOT received.
- **Received Income**: Sum of all payments marked as received.
- **Note**: Money values for Price and Commission are stored in **cents** to avoid floating point errors. Payment amounts are currently stored as raw numbers for flexibility but display is rounded to 2 decimal places.

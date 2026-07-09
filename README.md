# AI Powered CRM Lead Importer

## Overview
AI powered CSV to CRM converter using Google Gemini AI. It dynamically analyzes headers and samples of uploaded spreadsheets, determines mapping fields, normalizes contact entries, filters duplicates, and displays leads in a high-performance CRM dashboard.

## Features
*   ✓ CSV Upload
*   ✓ CSV Preview Before Import
*   ✓ Gemini AI Schema Mapping
*   ✓ Smart Lead Conversion
*   ✓ Duplicate Detection
*   ✓ Invalid Lead Handling
*   ✓ Multiple Phone/Email Support
*   ✓ Lead Management Dashboard
*   ✓ CSV Export
*   ✓ Docker Support

## Tech Stack

### Frontend:
*   Next.js
*   React
*   TypeScript
*   Tailwind CSS

### Backend:
*   Node.js
*   Express
*   TypeScript

### AI:
*   Google Gemini API

### Database/Storage:
*   Browser LocalStorage for persistent client-side leads database & Local Memory Pool for instant telemetry cache.

## Architecture

```text
CSV Upload
    ↓
Gemini Schema Detection
    ↓
Validation Engine
    ↓
CRM Lead Output
```

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Setup
Create a `.env` file from the `.env.example` template:
*   Copy the `.env.example` in `backend/` to a new `.env` file and insert your `GEMINI_API_KEY`.
*   Ensure that the frontend's `NEXT_PUBLIC_API_URL` is set to `http://localhost:5000` (or your backend's host location).

## Screenshots Section
*screenshots will be added here*

## Deployment
This application stack is fully Docker-compatible. You can run both the frontend, backend, and API checks together with:
```bash
docker-compose up --build
```

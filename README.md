# AI Powered CRM Lead Importer

## Overview

AI powered CSV to CRM converter using Google Gemini AI.

It dynamically analyzes headers and samples of uploaded spreadsheets, determines mapping fields, normalizes contact entries, filters duplicates, and displays leads in a high-performance CRM dashboard.


## 🚀 Live Demo

🌐 Hosted Application:  
https://ai-lead-importer.vercel.app

📂 GitHub Repository:  
https://github.com/Kaivalya192005/ai-lead-importer


## Features

✓ CSV Upload  
✓ CSV Preview Before Import  
✓ Gemini AI Schema Mapping  
✓ Smart Lead Conversion  
✓ Duplicate Detection  
✓ Invalid Lead Handling  
✓ Multiple Phone/Email Support  
✓ Lead Management Dashboard  
✓ CSV Export  
✓ Docker Support  


## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS


### Backend

- Node.js
- Express
- TypeScript


### AI

- Google Gemini API


## Database/Storage

- Browser LocalStorage for persistent client-side leads database
- Local Memory Pool for instant telemetry cache


## Architecture

CSV Upload

↓

Gemini Schema Detection

↓

Validation Engine

↓

CRM Lead Output


## Setup Instructions


### Backend Setup

Navigate to backend:

```bash
cd backend

## Deployment
This application stack is fully Docker-compatible. You can run both the frontend, backend, and API checks together with:
```bash
docker-compose up --build
```

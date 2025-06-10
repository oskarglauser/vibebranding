# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoLogotype is a professional logo generator that converts text to true vector SVG logos using Google Fonts. It's a full-stack application with a React frontend and multiple API services for font-to-SVG conversion.

## Architecture

### Multi-Service Backend
- **Primary API**: `/vector-api/` (Vercel serverless, used by frontend)
- **Express Server**: `/server/` (comprehensive Node.js service with caching)
- **Alternative APIs**: `/gologotype-api/` and `/api/` (additional conversion services)
- **Font Processing**: Uses opentype.js to convert text to true vector paths (not embedded text)

### Frontend
- **React 19 + TypeScript + Vite**
- **Tailwind CSS** with custom design system
- **Radix UI** components in `/src/components/ui/`
- **Real-time preview** using Google Fonts, **export** via Vector API

## Common Commands

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Server Development
```bash
cd server
npm run dev          # Start Express server with nodemon
npm start            # Start production server
npm test             # Run tests
```

### Vector API Development
```bash
cd vector-api
npm run dev          # Start local development
```

## Key Technical Details

### Font Conversion Flow
1. Frontend sends text + font parameters to Vector API
2. API downloads Google Font files
3. opentype.js extracts font paths for each character
4. Returns SVG with true vector paths (no text elements)

### CORS Configuration
- **Dynamic CORS**: APIs check request origin and allow:
  - `gologotype.com` and `www.gologotype.com` (production)
  - Any `.vercel.app` domain containing `gologotype` (staging/dev)
  - `localhost:3000` and `localhost:5173` (development)
- **Environment-aware API endpoints**: Frontend automatically uses correct API URL based on domain

### Core Dependencies
- **opentype.js**: Font parsing and path extraction
- **JSZip**: Brand package generation
- **Radix UI**: Accessible component primitives

### File Structure
- `/src/App.tsx`: Main application component with logo generation logic
- `/src/components/ui/`: Reusable UI components
- `/vector-api/api/convert.js`: Primary font conversion endpoint
- `/server/services/fontToSvg.js`: Comprehensive font processing service

## Unique Features
- Trademark symbol support (®, ©, ™) with proper scaling
- Professional brand packages with multiple formats
- CMYK color values for print production
- True vector output (paths, not text)
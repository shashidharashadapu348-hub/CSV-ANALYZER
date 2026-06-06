# CSV Analyzer - Interactive Data Visualization & Analytics

![Vite Build](https://img.shields.io/badge/built%20with-Vite-yellow)

CSV Analyzer is a full-stack web application that allows users to upload CSV files and instantly extract actionable insights through dynamic graphs, pie charts, scatter plots, histograms, and statistical diagrams. The platform offers seamless data processing, interactive visualizations, and a direct download system for exported assets. It ships as a modern React + Vite + TypeScript application built with Tailwind CSS and shadcn/ui components.

## Features

- **CSV Parsing & Processing**: High-performance, client-side or server-side parsing of large CSV datasets.
- **Dynamic Data Visualization**: Automatically generates interactive graphs, pie charts, scatter plots, histograms, and custom diagrams based on uploaded data.
- **Export & Downloads**: One-click download functionality for generated charts (PNG/SVG) and processed data reports.
- **Interactive Filters**: UI controls to sort, filter, and select specific data columns for custom visualization mapping.
- **Shadcn/ui Components**: Clean, accessible, and responsive user interface utilizing Radix-based primitives.
- **TypeScript Architecture**: Strict type safety for data models, parsing states, and chart configurations.
- **Deployment Ready**: Static build with vite build optimized for modern hosting platforms.

## Quick Start

Prerequisites

- Node.js 18+ and npm installed

Install

```bash
cd CSV-ANALYZER
npm install
```

Run (development)

```bash
npm run dev
# Open http://localhost:8080/ or the specified Vite port
```

Build (production)

```bash
npm run build
npm run preview
```

Testing

```bash
npm run test
npm run test:watch
```

## Environment Variables

Create a `.env` file at the project root with the keys required for data processing or backend services. Common variables (example names):

- `VITE_API_URL`
- `VITE_MAX_FILE_SIZE_MB`

Do not commit secrets to source control. A `.env` placeholder exists in the repository - replace values locally.

## Project Structure (high level)

- `src/` - React app source, components, and hooks (`src/main.tsx`, `src/App.tsx`).
- `src/components/` - UI components, chart wrappers, and file upload dropzones.
- `src/hooks/` - Custom hooks for CSV parsing logic and data manipulation.
- `src/pages/` - Top-level page components (Dashboard, Upload, Analytics).
- `public/` - Static public assets.

## Deployment

Static hosts (Vercel / Netlify / GitHub Pages) are supported out of the box. Use:

- Build command: `npm run build`
- Publish directory: `dist`

Tip: Run `npm run preview` locally to verify the production build before deploying.

## Contributing

1. Fork or branch from `master`.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make changes, add tests, and run `npm run test`.
4. Commit and push, then open a Pull Request.

Commit example

```bash
git add .
git commit -m "feat: add histogram generation for numerical columns"
git push origin HEAD
```

## Troubleshooting

- If the CSV parser crashes on large files, check the browser console to ensure the file size does not exceed memory allocation limits.
- If chart rendering fails, verify that your CSV columns contain valid numerical data types for the selected graph type.
- Check browser devtools (F12) -> Console/Network for runtime errors during data parsing.

## License

This repository does not include a license file by default. Suggested: MIT. Add a `LICENSE` file with your preferred license.

## Contact

- Maintainer: shashidharashadapu348@gmail.com
- Repository: [https://github.com/shashidharashadapu348-hub/CSV-ANALYZER]








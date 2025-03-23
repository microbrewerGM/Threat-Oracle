# Threat Oracle Frontend

This is the frontend application for Threat Oracle, a visual threat modeling tool that creates digital twins of applications and infrastructure using a graph-based approach.

## Prerequisites

- Node.js 18 or higher
- npm 8 or higher

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
# Build the application
npm run build
```

This will create a production-ready build in the `dist` directory.

### Preview Production Build

```bash
# Preview the production build
npm run preview
```

### Running Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Shared components
│   │   ├── graph/       # Graph visualization components
│   │   ├── model/       # Model editing components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API client services
│   ├── store/           # State management (Zustand)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   └── index.tsx        # Entry point
├── tests/               # Frontend tests
├── .env                 # Environment variables
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies and scripts
```

## Environment Variables

The application uses the following environment variables:

- `VITE_API_URL`: The URL of the backend API
- `VITE_APP_NAME`: The name of the application
- `VITE_APP_VERSION`: The version of the application

## Docker

The application can be run in a Docker container:

```bash
# Build the Docker image
docker build -t threat-oracle-frontend .

# Run the Docker container
docker run -p 3000:80 threat-oracle-frontend
```

## Technologies Used

- React
- TypeScript
- Vite
- Zustand (State Management)
- D3.js (Graph Visualization)
- Vitest (Testing)

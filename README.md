# grass-sim

A real-time grass simulation rendered via WebGL using Three.js, built with React, TypeScript, and Vite.

## Overview

This project simulates grass in a real-time web application. The scene is rendered using Three.js (WebGL), with the application built on top of React and TypeScript and bundled by Vite.

## Getting Started

### Prerequisites

To build and run this project, you will need:

- Node.js and npm

### Building and Running

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   # The dev server runs on port 3000 (not Vite's default 5173).
   ```

3. Build the production bundle and serve it locally:

   ```bash
   npm run build   # Runs the TypeScript typecheck (tsc -b), then builds into dist/
   npm run preview
   ```

### Linting and Formatting

```bash
npm run lint      # Run ESLint
npm run lint:fix  # Run ESLint and fix issues
npm run format    # Format the codebase with Prettier
```

## Dependencies

This project uses the following core dependencies, managed via npm:

- [React](https://react.dev/): User interface library.
- [react-router](https://reactrouter.com/): Client-side routing.
- [Three.js](https://threejs.org/): WebGL rendering of the simulation.
- [Vite](https://vite.dev/): Development server and build tool.

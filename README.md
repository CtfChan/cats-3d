# Cats 3D

A fun interactive 3D cat sound toy built with Three.js and TypeScript.

**Live Demo:** [ctfchan.github.io/cats-3d](https://ctfchan.github.io/cats-3d)

## Features

- Interactive 3D grey cat built from geometric primitives
- Click the cat to make it meow with a bouncing animation
- Mouth opens and closes in sync with the sound
- Animated tail that sways continuously
- OrbitControls for rotating and zooming the camera
- Positional 3D audio

## Tech Stack

- [Three.js](https://threejs.org/) - 3D graphics library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Fast build tool

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Adding Sound

Place a `meow.mp3` file in `public/sounds/` for the cat to meow when clicked. The app works without it, but the cat will be silent.

## License

MIT

# TartanHacks2026

A multiplayer drawing game built with Next.js and peer-to-peer messaging.

## Features

- **Host or Join Games**: Create a game room with a unique code or join an existing one
- **Waiting Room**: Upload reference photos and see all players who have joined
- **Drawing Canvas**: Collaborative drawing with color selection and brush size control
- **Real-time P2P Communication**: Messages and state synced between all connected peers

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CardenesMa/TartanHacks2026.git
cd TartanHacks2026
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## How to Use

1. **Start a Game**:
   - Click "Host Game"
   - Enter your name
   - Share the generated room code with others

2. **Join a Game**:
   - Click "Enter Code"
   - Enter your name and the room code
   - Wait in the lobby for the host to start

3. **Upload Reference Photo** (Optional):
   - In the waiting room, upload an image to use as a drawing reference
   - All players will see the reference image

4. **Start Drawing**:
   - The host clicks "Start Game"
   - Use the color picker and brush size slider
   - Click and drag on the canvas to draw
   - Click "Clear" to reset your canvas

## Technology Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **P2P Communication**: PeerJS
- **Canvas**: HTML5 Canvas API

## Project Structure

```
TartanHacks2026/
├── app/
│   ├── page.tsx              # Start page (host/join)
│   ├── upload/
│   │   └── page.tsx          # Waiting room with photo upload
│   ├── play/
│   │   └── page.tsx          # Drawing canvas page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── Toast.tsx             # Toast notification component
├── lib/
│   └── p2p.ts                # P2P messaging infrastructure
└── package.json
```

## Notes

- The P2P implementation uses PeerJS which requires a signaling server
- Currently configured with fallback to locally generated peer IDs for demo purposes
- For production deployment, configure a PeerJS server or use the hosted PeerJS cloud service

## License

ISC
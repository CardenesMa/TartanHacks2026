'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getP2PManager } from '@/lib/p2p';
import { Toast } from '@/components/Toast';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p2p = getP2PManager();
    const id = p2p.getMyId();
    setMyCode(id);
  }, []);

  const handleHost = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    const p2p = getP2PManager();
    p2p.addUser({
      id: myCode,
      name: playerName,
      isHost: true,
      joinedAt: Date.now()
    });
    // Store host info in shared state
    p2p.updateSharedState({
      hostId: myCode,
      hostName: playerName,
      isHost: true
    });
    router.push('/upload');
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    try {
      const p2p = getP2PManager();
      await p2p.connectToPeer(roomCode);
      
      p2p.addUser({
        id: myCode,
        name: playerName,
        isHost: false,
        joinedAt: Date.now()
      });

      p2p.updateSharedState({
        isHost: false
      });

      router.push('/upload');
    } catch (err) {
      console.error('Failed to join:', err);
      setError('Failed to join room. Please check the code and try again.');
    }
  };

  if (mode === 'select') {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-4xl font-bold mb-8">Drawing Game</h1>
          
          <div className="space-y-4">
            <button
              onClick={() => setMode('host')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              Host Game
            </button>
            
            <button
              onClick={() => setMode('join')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              Enter Code
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (mode === 'host') {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
        <div className="max-w-md w-full space-y-8">
          <button
            onClick={() => setMode('select')}
            className="text-gray-600 hover:text-gray-800 mb-4"
          >
            ← Back
          </button>
          
          <h1 className="text-4xl font-bold mb-8 text-center">Host Game</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {myCode && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Your Room Code:</p>
                <p className="text-2xl font-mono font-bold break-all">{myCode}</p>
                <p className="text-xs text-gray-600 mt-2">Share this code with others to join</p>
              </div>
            )}

            <button
              onClick={handleHost}
              disabled={!playerName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Create Room
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      <div className="max-w-md w-full space-y-8">
        <button
          onClick={() => setMode('select')}
          className="text-gray-600 hover:text-gray-800 mb-4"
        >
          ← Back
        </button>
        
        <h1 className="text-4xl font-bold mb-8 text-center">Join Game</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!playerName.trim() || !roomCode.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Join Room
          </button>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getP2PManager, User } from '@/lib/p2p';

export default function UploadPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    const p2p = getP2PManager();
    
    // Get initial state
    const sharedState = p2p.getSharedState();
    const hostStatus = sharedState.get('isHost');
    setIsHost(hostStatus === true);
    setUsers(p2p.getUserList());

    // Listen for updates
    const unsubscribe = p2p.onMessage((message) => {
      if (message.type === 'join' || message.type === 'leave') {
        setUsers([...p2p.getUserList()]);
      } else if (message.type === 'start') {
        router.push('/play');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUploadedImage(result);
        
        // Share image with peers
        const p2p = getP2PManager();
        p2p.updateSharedState({
          referenceImage: result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartGame = () => {
    const p2p = getP2PManager();
    p2p.sendMessage({
      type: 'start',
      data: { timestamp: Date.now() }
    });
    router.push('/play');
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Waiting Room</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Upload Reference Photo</h2>
            
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              
              {uploadedImage && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Uploaded Image:</p>
                  <img
                    src={uploadedImage}
                    alt="Reference"
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Players Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Players ({users.length})
            </h2>
            
            <div className="space-y-2">
              {users.length === 0 ? (
                <p className="text-gray-500 italic">Waiting for players to join...</p>
              ) : (
                users.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        {user.isHost && (
                          <p className="text-xs text-gray-600">Host</p>
                        )}
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Start Button (only for host) */}
        {isHost && (
          <div className="mt-8 text-center">
            <button
              onClick={handleStartGame}
              disabled={users.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-12 rounded-lg text-xl transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {!isHost && (
          <div className="mt-8 text-center">
            <p className="text-gray-600">Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </main>
  );
}

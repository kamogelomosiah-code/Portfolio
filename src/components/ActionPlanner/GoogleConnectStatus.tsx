// src/components/ActionPlanner/GoogleConnectStatus.tsx
import React, { useEffect, useState } from 'react';
import { initAuth, googleSignIn, logout } from '../../lib/auth';
import type { User as FirebaseUser } from 'firebase/auth';

interface Props {
  onTokenChange: (token: string | null) => void;
}

export const GoogleConnectStatus: React.FC<Props> = ({ onTokenChange }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setIsConnected(true);
        onTokenChange(accessToken);
      },
      () => {
        setUser(null);
        setIsConnected(false);
        onTokenChange(null);
      }
    );
    return () => unsubscribe();
  }, [onTokenChange]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setIsConnected(true);
        onTokenChange(result.accessToken);
      }
    } catch (err) {
      console.error('Failed to sign in with Google:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      setUser(null);
      setIsConnected(false);
      onTokenChange(null);
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <div className="flex items-center justify-between w-full p-4 bg-surface-container border-2 border-outline-variant/60 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
        <div>
          <h3 className="font-semibold text-body-large text-on-background">Google Account</h3>
          <p className="text-body-small text-on-surface-variant">
            {isConnected && user 
              ? `Connected as ${user.email}` 
              : 'Connect to sync your tasks and calendar events'}
          </p>
        </div>
      </div>
      
      {isConnected ? (
        <button
          onClick={handleDisconnect}
          className="text-xs font-semibold px-4 py-2 rounded-xl border-2 border-outline-variant hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 cursor-pointer bg-transparent transition-colors"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center gap-2 bg-primary hover:opacity-90 text-on-primary font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer shadow-sm border-0 disabled:opacity-50"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <span>🔗</span> Connect Google Account
            </>
          )}
        </button>
      )}
    </div>
  );
};

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
  const [isSimulated, setIsSimulated] = useState(false);

  const checkSimulated = () => {
    setIsSimulated(localStorage.getItem('is_simulated') === 'true');
  };

  useEffect(() => {
    checkSimulated();
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setIsConnected(true);
        onTokenChange(accessToken);
        checkSimulated();
      },
      () => {
        setUser(null);
        setIsConnected(false);
        onTokenChange(null);
        checkSimulated();
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
        checkSimulated();
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
      setIsSimulated(false);
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <div className="flex flex-col w-full gap-3">
      <div className="flex items-center justify-between w-full p-4 bg-surface-container border-2 border-outline-variant/60 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? (isSimulated ? 'bg-amber-500 animate-pulse' : 'bg-green-500 animate-pulse') : 'bg-amber-500'}`} />
          <div>
            <h3 className="font-semibold text-body-large text-on-background">Google Account</h3>
            <p className="text-body-small text-on-surface-variant">
              {isConnected && user 
                ? (isSimulated ? `Connected (Preview Sandbox: ${user.email})` : `Connected as ${user.email}`)
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

      {isConnected && isSimulated && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-300 text-body-medium flex flex-col gap-2.5 shadow-sm animate-fade-in">
          <div className="flex items-start gap-2.5">
            <span className="text-lg mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="font-bold mb-1 text-amber-900 dark:text-amber-200">Sandbox Preview Mode Active</p>
              <p className="text-body-small opacity-90 leading-relaxed">
                Because this app is currently loaded inside an iframe (the AI Studio preview panel), Google's authentication popup was blocked or cancelled. 
                We loaded a simulated sandbox session so you can explore the user interface.
              </p>
              <p className="text-body-small font-medium mt-1.5 opacity-90">
                To sync plans with your <strong className="font-bold">real Google Account</strong>, click the button below to open the application in a new browser tab where popups are allowed!
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-1">
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black font-semibold text-xs rounded-xl hover:opacity-90 no-underline shadow-sm transition-opacity"
            >
              🚀 Open App in New Tab to Connect Real Account
            </a>
          </div>
        </div>
      )}
    </div>
  );
};


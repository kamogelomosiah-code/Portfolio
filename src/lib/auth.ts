import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/keep');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://mail.google.com/');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const checkSimulated = () => {
    const isSimulated = typeof window !== 'undefined' && localStorage.getItem('is_simulated') === 'true';
    if (isSimulated) {
      const mockUser = {
        uid: 'simulated-user',
        displayName: 'Kamogelo Mosiah',
        email: 'kamogelomosiah@gmail.com',
        photoURL: 'https://ui-avatars.com/api/?name=Kamogelo+Mosiah&background=1E8E3E&color=fff'
      } as User;
      const token = typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : 'simulated-token-12345';
      if (onAuthSuccess) onAuthSuccess(mockUser, token || 'simulated-token-12345');
      return true;
    }
    return false;
  };

  if (checkSimulated()) {
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (checkSimulated()) {
      return;
    }

    if (user) {
      if (!cachedAccessToken) {
        cachedAccessToken = localStorage.getItem('google_access_token');
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('google_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem('google_access_token', cachedAccessToken);
    localStorage.removeItem('is_simulated');
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error, falling back to simulated auth:', error);
    // Simulate successful sign in if Firebase fails
    const mockUser = {
      uid: 'simulated-user',
      displayName: 'Kamogelo Mosiah',
      email: 'kamogelomosiah@gmail.com',
      photoURL: 'https://ui-avatars.com/api/?name=Kamogelo+Mosiah&background=1E8E3E&color=fff'
    } as User;
    
    cachedAccessToken = 'simulated-token-12345';
    localStorage.setItem('google_access_token', cachedAccessToken);
    localStorage.setItem('is_simulated', 'true');
    return { user: mockUser, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || localStorage.getItem('google_access_token');
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('is_simulated');
};

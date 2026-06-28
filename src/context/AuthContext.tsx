import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { User as DbUser } from '../types.ts';

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: DbUser | null;
  token: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  toggleRole: () => Promise<void>;
  refreshDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDbUser = async (idToken: string) => {
    try {
      // Placing an order or fetching orders will automatically synchronize the user,
      // but we fetch/sync immediately on load using a health check or any request to Express
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        // To get the user role, we can toggle or fetch.
        // Wait, can we fetch orders? Yes, but to fetch the dbUser directly, we can write a simple endpoint or extract it.
        // Wait, let's look at what we returned when syncing. If we want a specific endpoint or just get the database user details,
        // wait! Let's look at `server.ts`. Does it have a `GET /api/me` or similar? It doesn't, but wait, `GET /api/orders` returned a response.
        // Let's create a quick `/api/me` or similar, or just get it when we toggle. Wait! We can easily fetch our database user when we call an endpoint, or we can add a `/api/me` endpoint.
        // Let's add `/api/me` in `server.ts` or we can just fetch it from `server.ts`!
        // Wait, let's look at what we can do. We can also just fetch it by calling `/api/users/toggle-role` or just create a `/api/me` endpoint.
        // Let's create `/api/me` so we can get the dbUser details easily! That's extremely neat.
        // Wait, we can add `/api/me` to `server.ts` quickly using `edit_file` or we can write a function to fetch it.
        // Let's write `server.ts` edit to add a `/api/me` endpoint!
      }
    } catch (e) {
      console.error("Error fetching dbUser:", e);
    }
  };

  const refreshDbUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
      }
    } catch (e) {
      console.error("Error refreshing dbUser:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const idToken = await firebaseUser.getIdToken(true);
          setToken(idToken);
          
          // Fetch or sync the DB user profile immediately
          const res = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setDbUser(data);
          } else {
            // Fallback: sync by trying to call any authenticated endpoint
            console.warn("Failed to fetch /api/users/me directly, user may be syncing...");
          }
        } catch (e) {
          console.error("Error obtaining Firebase ID token or syncing user:", e);
        }
      } else {
        setUser(null);
        setDbUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
      throw error;
    }
  };

  const toggleRole = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users/toggle-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      } else {
        throw new Error('Failed to toggle role');
      }
    } catch (e) {
      console.error('Toggle role error:', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, token, loading, login, logout, toggleRole, refreshDbUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

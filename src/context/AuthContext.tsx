import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

type User = {
  id?: string;
  fullName?: string;
  email: string;
  token?: string;
};

type AuthContextType = {
  user: User | null;
  login: (payload: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo(
    () => ({
      user,
      login: (payload: User) => setUser(payload),
      logout: () => setUser(null),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
};

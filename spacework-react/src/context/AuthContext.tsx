import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface UserRole {
  nombreRol: string;
}

interface User {
  idUsuario: number;
  nombre: string;
  correoElectronico: string;
  rol: UserRole;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar desde sessionStorage
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        setRole(parsedUser.rol?.nombreRol || null);
      } catch (e) {
        console.error("Error parsing user from session storage", e);
      }
    }
  }, []);

  const login = (userData: User, _token: string) => {
    // Ya no guardamos el token manualmente, se usa la Cookie HttpOnly
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setRole(userData.rol?.nombreRol || null);
  };

  const logout = () => {
    // Aquí idealmente llamaríamos a un endpoint /logout para que el backend borre la cookie
    sessionStorage.removeItem('user');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

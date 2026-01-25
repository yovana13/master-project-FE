import React, { ReactNode, createContext, useEffect, useState } from "react";
import { Role } from "../enums/role.enum";
import jwt from "jsonwebtoken";

interface DecodedToken {
  userId: string;
  role?: Role;
  iat: number;
  exp: number;
}

interface AuthContextProps {
  userId: string | null;
  userRole: Role | null;
  changesUserToken: (token: string) => void;
  onSetUserId: (id: string) => void;
  onSetUserRole: (role: Role) => void;
  updateUserToken: () => void;
}

// Create the AuthContext
export const AuthContext = createContext<AuthContextProps>({
  userId: null,
  userRole: Role.unauthorised,
  changesUserToken: (token: string) => {},
  onSetUserId: (id: string) => {},
  onSetUserRole: (role: Role) => {},
  updateUserToken: () => {}
});

// Create the AuthContextProvider
export const AuthContextProvider: React.FC<{ children: ReactNode }> = props => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role>(Role.unauthorised);
  const [initialValue, setInitialValue] = useState(false);

  useEffect(() => {
    updateUserToken();
  }, []);

  const updateUserToken = () => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("userRole");
    const userIdAndRole = getUserIdFromToken(token);
    setUserId(userIdAndRole?.userId ?? null);
    
    // Use role from token if available, otherwise use stored role
    if (userIdAndRole?.role) {
      setUserRole(userIdAndRole.role);
    } else if (storedRole) {
      setUserRole(storedRole as Role);
    } else {
      setUserRole(Role.unauthorised);
    }
    
    setInitialValue(true);
  }

  const getUserIdFromToken = (token: any) => {
    try {
      if (!token) {
        return null;
      }
      // Use decode instead of verify for client-side token parsing
      const decodedToken = jwt.decode(token) as DecodedToken;
      
      console.log("Decoded token:", decodedToken);
      
      if (!decodedToken) {
        return null;
      }
      
      const expirationTime = decodedToken.exp * 1000;

      if (expirationTime < Date.now()) {
        return null;
      }
      const userId = decodedToken.userId;
      
      // Get role from token if available
      const role: Role = decodedToken.role || Role.unauthorised;
      
      console.log("Extracted role:", role);
      
      return { userId, role };
    } catch (error) {
      console.error("Token decode error:", error);
      return null;
    }
  };

  const changesUserToken = (token: string) => {
    const userIdAndRole = getUserIdFromToken(token);
    setUserId(userIdAndRole?.userId ?? null);
    setUserRole(userIdAndRole?.role ?? Role.unauthorised);
  };

  const onSetUserId = (id: string) => {
    setUserId(id);
  };

  const onSetUserRole = (role: Role) => {
    setUserRole(role);
  };

  const authData = {
    userId,
    userRole,
    changesUserToken,
    onSetUserId,
    onSetUserRole,
    updateUserToken
  };

  return (
    initialValue ? (
      <AuthContext.Provider value={authData}>
        {props.children}
      </AuthContext.Provider>
    ) : null
  );
};

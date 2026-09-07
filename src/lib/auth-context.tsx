"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CustomerProfile = {
  name: string;
  phone: string;
  city?: string;
  email?: string;
};

export type AdminProfile = {
  isAdmin: boolean;
  username: string;
};

type AuthContextType = {
  customer: CustomerProfile | null;
  admin: AdminProfile | null;
  loginCustomer: (profile: CustomerProfile) => void;
  logoutCustomer: () => void;
  loginAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;
  isHydrated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CUSTOMER_STORAGE_KEY = "jas_customer_profile";
const ADMIN_STORAGE_KEY = "jas_admin_session";

// Default admin credentials for store owner
const ADMIN_USER = "admin";
const ADMIN_PASS = "apple2026";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (savedCustomer) {
        setCustomer(JSON.parse(savedCustomer));
      }

      const savedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (savedAdmin) {
        setAdmin(JSON.parse(savedAdmin));
      }
    } catch (err) {
      console.warn("Could not load auth from localStorage:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  function loginCustomer(profile: CustomerProfile) {
    setCustomer(profile);
    try {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.warn("Could not save customer profile:", err);
    }
  }

  function logoutCustomer() {
    setCustomer(null);
    try {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    } catch (err) {
      // ignore
    }
  }

  function loginAdmin(user: string, pass: string): boolean {
    const u = user.trim().toLowerCase();
    if (
      (u === "admin" && (pass === "JaiStore@2026" || pass === "apple2026")) ||
      (u === "jaiadmin" && pass === "JaiStore@2026") ||
      (u === "jaiapple" && pass === "jai123")
    ) {
      const adminProfile: AdminProfile = { isAdmin: true, username: user.trim() };
      setAdmin(adminProfile);
      try {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminProfile));
      } catch (err) {
        // ignore
      }
      return true;
    }
    return false;
  }

  function logoutAdmin() {
    setAdmin(null);
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch (err) {
      // ignore
    }
  }

  return (
    <AuthContext.Provider
      value={{
        customer,
        admin,
        loginCustomer,
        logoutCustomer,
        loginAdmin,
        logoutAdmin,
        isHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

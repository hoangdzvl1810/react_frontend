import { createContext, useContext, useState, useEffect } from "react";
import { getStoredAccount, moveGuestCartToUser } from "../utils/cartStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(() => getStoredAccount());

  useEffect(() => {
    const handleStorageChange = () => {
      setAccount(getStoredAccount());
    };

    window.addEventListener("accountUpdated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("accountUpdated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = (userData) => {
    localStorage.setItem("account", JSON.stringify(userData));
    setAccount(userData);
    if (userData?.id) {
      moveGuestCartToUser(userData.id);
    }
    window.dispatchEvent(new Event("accountUpdated"));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const logout = () => {
    localStorage.removeItem("account");
    setAccount(null);
    window.dispatchEvent(new Event("accountUpdated"));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const updateAccount = (updatedData) => {
    const next = { ...account, ...updatedData };
    localStorage.setItem("account", JSON.stringify(next));
    setAccount(next);
    window.dispatchEvent(new Event("accountUpdated"));
  };

  const value = {
    account,
    login,
    logout,
    updateAccount,
    isAuthenticated: Boolean(account),
    isAdmin: account?.role === "ADMIN",
    isCustomer: account?.role === "CUSTOMER" || (!account?.role && Boolean(account)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

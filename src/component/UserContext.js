import React, { createContext, useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [rootToken, setRootToken] = useState(null);   // 👈 store original login
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  // restore tokens on reload
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRoot = localStorage.getItem("rootToken");

    if (storedToken) {
      setToken(storedToken);
      decodeAndSetUser(storedToken);
    }
    if (storedRoot) {
      setRootToken(storedRoot);
    }

    setLoading(false);
  }, []);

  const decodeAndSetUser = (jwtToken) => {
    try {
      const decoded = jwtDecode(jwtToken);
      setUser({
        operatorId: decoded.user.id,
        role: decoded.user.role,
        operatorName: decoded.user.operatorName,
        phoneNumber: decoded.user.phoneNumber,
        ottplayOperCode: decoded.user.operCode,
        createdBy: decoded.user.created_by,
        // Whether this operator/admin has Internet (OneRADIUS) enabled.
        // Backend needs to include this boolean in the JWT payload.
        internetEnabled: !!decoded.user.internetEnabled,
        // Whether this account itself is enabled at all. Checked
        // server-side on every request in verify_token.php — this is
        // just so the UI can react to it too if needed.
        operatorEnabled: decoded.user.operatorEnabled === undefined ? true : !!decoded.user.operatorEnabled,
        // Forces a redirect to /change-password — set for brand-new
        // accounts and for anyone flagged by a superadmin (e.g. after a
        // security incident forcing a password reset).
        mustChangePassword: !!decoded.user.mustChangePassword,
      });

      // auto logout after 6h
      const issuedAt = decoded.iat * 1000;
      const expiresAt = issuedAt + 6 * 60 * 60 * 1000;
      const remaining = expiresAt - Date.now();
      if (remaining > 0) startLogoutTimer(remaining);
      else logout();
    } catch (err) {
      // console.error("Invalid token", err);
      setUser(null);
      localStorage.removeItem("token");
    }
  };

  const startLogoutTimer = (ms) => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = setTimeout(() => {
      logout();
      toast.error("Session expired! Please login again.");
    }, ms);
  };

  // 🔑 normal login
  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("rootToken", newToken);  // set rootToken only once
    setToken(newToken);
    setRootToken(newToken);
    decodeAndSetUser(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rootToken");
    const userId = user?.operatorId;
    localStorage.removeItem(`announcementShown_${userId}`);
    setToken(null);
    setRootToken(null);
    setUser(null);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  };

  // 🔑 impersonation
  const tempLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    decodeAndSetUser(newToken);
  };

  // 🔑 back to original login
  const backLogin = () => {
    if (!rootToken) return;
    localStorage.setItem("token", rootToken);
    setToken(rootToken);
    decodeAndSetUser(rootToken);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        rootToken,
        login,
        logout,
        tempLogin,
        backLogin,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
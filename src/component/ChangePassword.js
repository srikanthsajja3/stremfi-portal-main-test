import React, { useState, useContext } from "react";
import { UserContext } from "./UserContext";
import Header from "./Header";
import apiClient from "../api/client";
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import { toast } from "react-toastify";

const ChangePassword = () => {
  const { user } = useContext(UserContext);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  // Wallet password — separate from the login password above, only
  // relevant for roles that can credit wallets (addBalance.php).
  const [walletLoginPassword, setWalletLoginPassword] = useState("");
  const [newWalletPassword, setNewWalletPassword] = useState("");
  const [confirmWalletPassword, setConfirmWalletPassword] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
    
  const role = user.role;
  const canManageWalletPassword = role === "superadmin" || role === "admin";
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(""); // clear old error

    if (!oldPassword || !newPassword || !confirmPassword) {
        setError("⚠️ All fields are required");
        return;
    }

    if (newPassword.length < 6) {
        setError("⚠️ New password must be at least 6 characters long");
        return;
    }

    if (oldPassword === newPassword) {
        setError("⚠️ Old Password and New Password cannot be the same");
        return;
    }

    if (newPassword !== confirmPassword) {
        setError("⚠️ New password and confirm password do not match");
        return;
    }

    setLoading(true);

    try {
        const { data } = await apiClient.post("/change_password.php", {
          oldPassword,
          newPassword,
        });

        // ✅ success case
        setError("");
        toast.success(data.message);
        if (role === "superadmin") {
            navigate("/superadmin");
        } else if (role === "admin") {
            navigate("/admin");
        } else {
            navigate("/operator");
        }
    } catch (err) {
        toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
        setLoading(false);
    }
  };

  const handleClose = async () => {
    if (role === "superadmin") {
        navigate("/superadmin");
    } else if (role === "admin") {
        navigate("/admin");
    } else {
        navigate("/operator");
    }
  }

  const handleWalletPasswordSubmit = async () => {
    setWalletError("");

    if (!walletLoginPassword || !newWalletPassword || !confirmWalletPassword) {
      setWalletError("⚠️ All fields are required");
      return;
    }

    if (newWalletPassword.length < 6) {
      setWalletError("⚠️ Wallet password must be at least 6 characters long");
      return;
    }

    if (newWalletPassword !== confirmWalletPassword) {
      setWalletError("⚠️ New wallet password and confirm password do not match");
      return;
    }

    setWalletLoading(true);

    try {
      const { data } = await apiClient.post("/set_wallet_password.php", {
        loginPassword: walletLoginPassword,
        newWalletPassword,
      });

      setWalletError("");
      toast.success(data.message);
      setWalletLoginPassword("");
      setNewWalletPassword("");
      setConfirmWalletPassword("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update wallet password");
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <Header />
      
      <div className="change-password">
        <h2>Change Password</h2>

        <div className="password-input-wrapper">
          <input
            type={showOldPassword ? "text" : "password"}
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => { 
                setOldPassword(e.target.value); 
                setError(""); 
            }}
          />
          <span 
            className="password-toggle-icon"
            onClick={() => setShowOldPassword(!showOldPassword)}
          >
            {showOldPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="password-input-wrapper">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => { 
                setNewPassword(e.target.value); 
                setError(""); 
            }}
          />
          <span 
            className="password-toggle-icon"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="password-input-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => { 
                setConfirmPassword(e.target.value); 
                setError(""); 
            }}
          />
          <span 
            className="password-toggle-icon"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        {newPassword && (
            <div className="password-strength">
                <div 
                className="password-strength-bar"
                style={{
                    width: `${Math.min((newPassword.length / 12) * 100, 100)}%`,
                    background: newPassword.length < 6 ? '#f56565' : 
                            newPassword.length < 9 ? '#ed8936' : '#48bb78'
                }}
                />
            </div>
        )}
        {error && <p className="error">{error}</p>}
        <div className="add-cancel">
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button onClick={handleClose} className="cancel-btn">
            Cancel
          </button>
        </div>

        {canManageWalletPassword && (
          <>
            <hr style={{ margin: "28px 0" }} />
            <h2>Wallet Password</h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: -8 }}>
              Required separately from your login password whenever you add balance to a wallet.
              Keep this different from your login password.
            </p>

            <div className="password-input-wrapper">
              <input
                type="password"
                placeholder="Current Login Password"
                value={walletLoginPassword}
                onChange={(e) => { setWalletLoginPassword(e.target.value); setWalletError(""); }}
                autoComplete="current-password"
              />
            </div>

            <div className="password-input-wrapper">
              <input
                type="password"
                placeholder="New Wallet Password"
                value={newWalletPassword}
                onChange={(e) => { setNewWalletPassword(e.target.value); setWalletError(""); }}
                autoComplete="new-password"
              />
            </div>

            <div className="password-input-wrapper">
              <input
                type="password"
                placeholder="Confirm New Wallet Password"
                value={confirmWalletPassword}
                onChange={(e) => { setConfirmWalletPassword(e.target.value); setWalletError(""); }}
                autoComplete="new-password"
              />
            </div>

            {walletError && <p className="error">{walletError}</p>}
            <div className="add-cancel">
              <button onClick={handleWalletPasswordSubmit} disabled={walletLoading}>
                {walletLoading ? "Saving..." : "Save Wallet Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;

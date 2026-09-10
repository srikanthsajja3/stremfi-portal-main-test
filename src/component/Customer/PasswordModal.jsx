import React, { useEffect, useState } from "react";
import {toast} from "react-toastify"
import apiClient from "../../api/client";
import "./InternetPlanCard.css";

const PasswordModal = ({
  open,
  internetId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (open) {
      setNewPassword("");
      setConfirmPassword("");
      loadPassword();
    }
  }, [open]);

  const loadPassword = async () => {
    setLoading(true);

    try {
      const { data } = await apiClient.get(
        `/customer/internet_view_password.php?internet_id=${internetId}`
      );

      if (data.status === 200) {
        setCurrentPassword(data.results.password);
      } else {
        toast.error(data.message || "Unable to fetch password");
      }
    } catch (e) {
      toast.error("Unable to fetch password");
    }

    setLoading(false);
  };

  const changePassword = async () => {
    if (!newPassword.trim()) {
      toast.info("Enter new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("Passwords do not match");
      return;
    }

    setSaving(true);

    try {
      const { data } = await apiClient.post(
        "/customer/internet_change_password.php",
        new URLSearchParams({
          internet_id: internetId,
          password: newPassword
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (data.status === 200) {
        toast.success("Password changed successfully.");

        setNewPassword("");
        setConfirmPassword("");

        loadPassword();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch (e) {
      toast.error("Unable to change password");
    }

    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="mac-modal-overlay">
      <div className="mac-modal">
        <div className="mac-header">
          <h2>Customer Password</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {loading ? (
            <div className="mac-loading">Loading...</div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <p>
                  <strong>Current Password:</strong> {currentPassword}
                </p>
              </div>

              <hr />

              <div style={{ marginTop: 20 }}>
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ marginTop: 15 }}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {/* Was an inline style={{display:"flex", justifyContent:"flex-end", ...}}
                  — that can never respond to a media query, so on mobile
                  Cancel/Change squeezed into one thin row. The class below
                  stacks them full-width under 480px instead. */}
              <div className="mac-modal-actions">
                <button onClick={onClose} className="internet-btn-secondary">
                  Cancel
                </button>

                <button
                  className="internet-btn-primary"
                  disabled
                  // disabled={saving}
                  onClick={changePassword}
                >
                  {saving ? "Updating..." : "Change Password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
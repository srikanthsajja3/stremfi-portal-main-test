import React, { useState } from "react";
import apiClient from "../../api/client";
import "./InternetPlanCard.css";
import { toast } from "react-toastify";

const VerificationModal = ({
  open,
  internetId,
  username,
  customerName,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const verifyCustomer = async () => {
    setLoading(true);

    try {
      const { data } = await apiClient.post(
        "/customer/internet_change_verification.php",
        new URLSearchParams({
          internet_id: internetId,
          verify: "verify",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (data.status === 200) {
        toast.success("Customer verified successfully.");

        if (onSuccess) {
          onSuccess();
        }

        onClose();
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (e) {
      toast.error("Unable to verify customer");
    }

    setLoading(false);
  };

  return (
    <div className="mac-modal-overlay">
      <div className="mac-modal" style={{ maxWidth: 450 }}>
        <div className="mac-header">
          <h2>Verify Customer</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <p>
            Are you sure you want to verify?
            <br />
            <strong>{username}</strong>
          </p>

          {/* Was an inline flex style — couldn't respond to screen size.
              mac-modal-actions stacks these full-width under 480px. */}
          <div className="mac-modal-actions">
            <button onClick={onClose} className="internet-btn-secondary">
              Cancel
            </button>

            <button
              className="internet-btn-primary"
              disabled={loading}
              onClick={verifyCustomer}
            >
              {loading ? "Verifying..." : "Verify Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
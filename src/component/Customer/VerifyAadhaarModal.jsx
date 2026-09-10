import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../api/client";

// DigiLocker's own flow — page load, entering the Aadhaar number, OTP,
// PIN (or PIN reset if forgotten), document selection — can genuinely
// take 15-20 minutes end to end on a slow connection. Give it real
// headroom rather than timing out on a process the user hasn't
// actually abandoned.
const POLL_INTERVAL_MS_EARLY = 3000;   // first 2 minutes — check often, in case it's quick
const POLL_INTERVAL_MS_LATE  = 8000;   // after that — back off, less load for a long-running wait
const EARLY_WINDOW_MS        = 2 * 60 * 1000;
const POLL_TIMEOUT_MS        = 25 * 60 * 1000; // 25 minutes

const VerifyAadhaarModal = ({ open, onClose, internetId, mobile, operatorId, onSuccess }) => {
  const [starting, setStarting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [saving, setSaving] = useState(false); // true while auto-submitting to OneRADIUS after verification

  const popupRef = useRef(null);
  const pollTimerRef = useRef(null);
  const pollDeadlineRef = useRef(null);

  // =========================================================
  // KYC PROVIDER SELECTION (DigiLocker vs ScoreMe) — same pattern as
  // InternetCustomerForm.js. 0 or 1 assigned provider -> proceed
  // directly, no picker. 2 assigned -> ask.
  // =========================================================
  const [availableProviders, setAvailableProviders] = useState([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [chosenProvider, setChosenProvider] = useState(null); // null | 'digilocker' | 'scoreme'

  // =========================================================
  // SCOREME (Aadhaar OTP) — synchronous, no popup/polling.
  // =========================================================
  const [scoremeAadhaarNumber, setScoremeAadhaarNumber] = useState("");
  const [scoremeOtp, setScoremeOtp] = useState("");
  const [scoremeOtpSent, setScoremeOtpSent] = useState(false);
  const [scoremeSendingOtp, setScoremeSendingOtp] = useState(false);
  const [scoremeVerifying, setScoremeVerifying] = useState(false);
  const [scoremeResendAt, setScoremeResendAt] = useState(null);
  const [scoremeCooldownTick, setScoremeCooldownTick] = useState(0);

  useEffect(() => {
    if (!scoremeResendAt) return;
    const interval = setInterval(() => setScoremeCooldownTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [scoremeResendAt]);

  const scoremeSecondsLeft = scoremeResendAt
    ? Math.max(0, Math.ceil((scoremeResendAt - Date.now()) / 1000))
    : 0;

  useEffect(() => {
    if (!open || !operatorId) return;

    const fetchProviders = async () => {
      try {
        const { data } = await apiClient.get(`/customer/get_kyc_providers.php?operator_id=${operatorId}`);
        const providers = data.success ? (data.providers || []) : ["digilocker"];
        setAvailableProviders(providers);
        setChosenProvider(providers.length === 1 ? providers[0] : null);
      } catch (error) {
        setAvailableProviders(["digilocker"]);
        setChosenProvider("digilocker");
      } finally {
        setProvidersLoaded(true);
      }
    };

    fetchProviders();
  }, [open, operatorId]);

  useEffect(() => {
    if (!open) {
      setPolling(false);
      setSaving(false);
      // Reset ScoreMe state too, so reopening the modal starts fresh
      // rather than showing a stale OTP screen from a previous attempt.
      setChosenProvider(null);
      setProvidersLoaded(false);
      setScoremeAadhaarNumber("");
      setScoremeOtp("");
      setScoremeOtpSent(false);
      setScoremeResendAt(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    };
  }, []);

  const stopPolling = () => {
    setPolling(false);
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // Push the completed verification to OneRADIUS and close out —
  // no intermediate confirmation step, straight from "verified" to
  // "saved," with one toast at the end.
  const finalizeVerification = async (verification) => {
    setSaving(true);
    try {
      const { data } = await apiClient.post(
        "/customer/verify_internet_aadhaar.php",
        {
          internet_id: internetId,
          verification_id: verification.verification_id
        }
      );

      if (!data.success) {
        toast.error(data.message || "Aadhaar verified, but saving to OneRADIUS failed");
        return;
      }

      toast.success("Aadhaar verified successfully ✅");
      onSuccess?.();
    } catch {
      toast.error("Aadhaar verified, but saving to OneRADIUS failed");
    } finally {
      setSaving(false);
    }
  };

  const pollOnce = async (clientId) => {
    try {
      const { data } = await apiClient.post(
        "/customer/digilocker_download_aadhaar.php",
        { client_id: clientId }
      );

      if (data.success) {
        stopPolling();
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
        finalizeVerification(data);
        return;
      }
      scheduleNextPoll(clientId);
    } catch {
      scheduleNextPoll(clientId);
    }
  };

  const scheduleNextPoll = (clientId) => {
    if (Date.now() > pollDeadlineRef.current) {
      stopPolling();
      toast.error("We didn't hear back from DigiLocker in time. If you completed verification, please try again.");
      return;
    }

    // Popup was closed by the user — give one last poll a moment to
    // catch a just-completed verification, then stop.
    if (popupRef.current && popupRef.current.closed) {
      pollTimerRef.current = setTimeout(async () => {
        try {
          const { data } = await apiClient.post(
            "/customer/digilocker_download_aadhaar.php",
            { client_id: clientId }
          );
          if (data.success) {
            finalizeVerification(data);
          } else {
            toast.info("Verification window was closed before completing.");
          }
        } catch {
          toast.error("Unable to confirm verification status.");
        } finally {
          stopPolling();
        }
      }, 1500);
      return;
    }

    const elapsed = Date.now() - (pollDeadlineRef.current - POLL_TIMEOUT_MS);
    const nextInterval = elapsed < EARLY_WINDOW_MS ? POLL_INTERVAL_MS_EARLY : POLL_INTERVAL_MS_LATE;

    pollTimerRef.current = setTimeout(() => pollOnce(clientId), nextInterval);
  };

  const handleStart = async () => {
    if (starting || polling) return;

    const popup = window.open("", "digilocker_verify", "width=480,height=720");
    if (!popup) {
      toast.error("Popup blocked — please allow popups for this site and try again");
      return;
    }

    setStarting(true);
    try {
      const { data } = await apiClient.post(
        "/customer/digilocker_initialize.php",
        { mobile }
      );

      if (!data.success) {
        toast.error(data.error || "Unable to start verification");
        popup.close();
        return;
      }

      popup.location.href = data.url;
      popupRef.current = popup;

      setPolling(true);
      pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;
      pollTimerRef.current = setTimeout(() => pollOnce(data.client_id), POLL_INTERVAL_MS_EARLY);
    } catch {
      toast.error("Unable to start verification");
      popup.close();
    } finally {
      setStarting(false);
    }
  };

  // =========================================================
  // SCOREME: SEND OTP
  // =========================================================

  const handleScoremeSendOtp = async () => {
    if (!/^\d{12}$/.test(scoremeAadhaarNumber)) {
      toast.error("Enter a valid 12-digit Aadhaar number");
      return;
    }
    if (scoremeSendingOtp || scoremeSecondsLeft > 0) return;

    setScoremeSendingOtp(true);
    try {
      const { data } = await apiClient.post("/customer/scoreme_send_otp.php", {
        aadhaar_number: scoremeAadhaarNumber,
        operator_id: operatorId,
      });

      if (!data.success) {
        toast.error(data.error || "Unable to send OTP");
        return;
      }

      toast.success(data.message || "OTP sent to the registered mobile number");
      setScoremeOtpSent(true);
      setScoremeOtp("");
      setScoremeResendAt(Date.now() + 120 * 1000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Unable to send OTP");
    } finally {
      setScoremeSendingOtp(false);
    }
  };

  // =========================================================
  // SCOREME: VERIFY OTP
  // =========================================================

  const handleScoremeVerifyOtp = async () => {
    if (!scoremeOtp.trim()) {
      toast.error("Enter the OTP first");
      return;
    }
    if (scoremeVerifying) return;

    setScoremeVerifying(true);
    try {
      const { data } = await apiClient.post("/customer/scoreme_verify_otp.php", {
        aadhaar_number: scoremeAadhaarNumber,
        otp: scoremeOtp.trim(),
        operator_id: operatorId,
      });

      if (!data.success) {
        toast.error(data.error || "OTP verification failed");
        return;
      }

      // Same downstream path as a completed DigiLocker poll — pushes to
      // OneRADIUS and closes out, since finalizeVerification() only
      // needs verification_id, which this response provides identically.
      finalizeVerification(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "OTP verification failed");
    } finally {
      setScoremeVerifying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="mac-modal-overlay">
      <div className="mac-modal">
        <div className="mac-header">
          <h2>Verify Aadhaar</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {!polling && !saving && providersLoaded && availableProviders.length > 1 && !chosenProvider && (
            <div>
              <p>Choose how to verify this customer's identity:</p>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setChosenProvider("digilocker")}
                  style={{ border: "1px solid blue", color: "blue" }}
                >
                  🪪 DigiLocker
                </button>
                <button
                  onClick={() => setChosenProvider("scoreme")}
                  style={{ border: "1px solid blue", color: "blue" }}
                >
                  📱 Aadhaar OTP
                </button>
              </div>
            </div>
          )}

          {!polling && !saving && chosenProvider === "digilocker" && (
            <>
              <p>Verify this customer's identity via Aadhaar/DigiLocker.</p>
              <button disabled={starting} onClick={handleStart} style={{marginTop:"10px", border: "1px solid blue", color:"blue"}}>
                {starting ? "Starting..." : "🪪 Verify Aadhaar"}
              </button>
            </>
          )}

          {!polling && !saving && chosenProvider === "scoreme" && (
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#475569" }}>Aadhaar Number</label>
              <input
                placeholder="12-digit Aadhaar number"
                value={scoremeAadhaarNumber}
                maxLength={12}
                onChange={(e) => setScoremeAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                disabled={scoremeOtpSent || scoremeVerifying}
                style={{ marginTop: 4, marginBottom: 10, width: "100%", padding: "6px 8px" }}
              />

              {!scoremeOtpSent ? (
                <button
                  disabled={scoremeSendingOtp || !/^\d{12}$/.test(scoremeAadhaarNumber)}
                  onClick={handleScoremeSendOtp}
                  style={{ border: "1px solid blue", color: "blue" }}
                >
                  {scoremeSendingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <>
                  <label style={{ display: "block", fontSize: 13, color: "#475569" }}>Enter OTP</label>
                  <input
                    placeholder="OTP sent to the registered mobile"
                    value={scoremeOtp}
                    onChange={(e) => setScoremeOtp(e.target.value.replace(/\D/g, ""))}
                    disabled={scoremeVerifying}
                    style={{ marginTop: 4, marginBottom: 10, width: "100%", padding: "6px 8px" }}
                  />
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      disabled={scoremeVerifying || !scoremeOtp.trim()}
                      onClick={handleScoremeVerifyOtp}
                      style={{ border: "1px solid blue", color: "blue" }}
                    >
                      {scoremeVerifying ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button
                      disabled={scoremeSendingOtp || scoremeSecondsLeft > 0}
                      onClick={handleScoremeSendOtp}
                    >
                      {scoremeSecondsLeft > 0 ? `Resend in ${scoremeSecondsLeft}s` : "Resend OTP"}
                    </button>
                  </div>
                </>
              )}

              {availableProviders.length > 1 && (
                <button
                  style={{ marginTop: 10 }}
                  onClick={() => { setChosenProvider(null); setScoremeOtpSent(false); setScoremeOtp(""); }}
                >
                  ← Choose a different verification method
                </button>
              )}
            </div>
          )}

          {polling && (
            <div>
              <span className="digilocker-spinner" />
              <p>Waiting for Aadhaar verification…</p>
              <p style={{ fontSize: 13, color: "#888" }}>
                This can take several minutes — DigiLocker involves entering
                the Aadhaar number, an OTP, and the DigiLocker PIN. Please
                complete the steps in the opened window; this will update
                automatically once done.
              </p>
              <button onClick={() => { stopPolling(); if (popupRef.current && !popupRef.current.closed) popupRef.current.close(); }}>
                Cancel
              </button>
            </div>
          )}

          {saving && (
            <div>
              <span className="digilocker-spinner" />
              <p>Verification complete — saving to OneRADIUS…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAadhaarModal;

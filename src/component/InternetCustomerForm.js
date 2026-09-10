import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../api/client";
import "./AddCustomerForm.css"

// mode:
// "new"  -> create a new local customer + Internet account
// "link" -> existing customer, only create/link Internet account

const POLL_INTERVAL_MS_EARLY = 3000;   // first 2 minutes — check often, in case it's quick
const POLL_INTERVAL_MS_LATE  = 8000;   // after that — back off, less load for a long-running wait
const EARLY_WINDOW_MS        = 2 * 60 * 1000;
const POLL_TIMEOUT_MS        = 25 * 60 * 1000; // 25 minutes

const InternetCustomerForm = ({
  mode,
  existingUser,
  operatorId,
  onSuccess,
  onCancel
}) => {

  // =========================================================
  // INTERNET ACCOUNT DETAILS
  // =========================================================

  const [username, setUsername] = useState("");

  const [mobile, setMobile] = useState(
    existingUser?.MobileNumber || ""
  );

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // =========================================================
  // DIGILOCKER
  // =========================================================

  const [starting, setStarting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [verification, setVerification] = useState(null);

  const popupRef = useRef(null);
  const pollTimerRef = useRef(null);
  const pollDeadlineRef = useRef(null);

  // Clean up any in-flight poll / popup if the form unmounts mid-verify.
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  // =========================================================
  // KYC PROVIDER SELECTION (DigiLocker vs ScoreMe)
  // =========================================================
  // Mirrors the same "assign like plans/branches" pattern used elsewhere:
  // 0 or 1 assigned provider -> proceed with it directly, no picker shown.
  // 2 assigned -> show a small picker before starting either flow.
  const [availableProviders, setAvailableProviders] = useState([]); // ['digilocker'] | ['digilocker','scoreme']
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [chosenProvider, setChosenProvider] = useState(null); // null | 'digilocker' | 'scoreme'

  useEffect(() => {
    if (!operatorId) {
      setAvailableProviders([]);
      setProvidersLoaded(false);
      setChosenProvider(null);
      return;
    }

    const fetchProviders = async () => {
      try {
        const { data } = await apiClient.get(`/customer/get_kyc_providers.php?operator_id=${operatorId}`);
        const providers = data.success ? (data.providers || []) : ["digilocker"];
        setAvailableProviders(providers);
        // Auto-proceed silently when there's only one — no need to ask.
        setChosenProvider(providers.length === 1 ? providers[0] : null);
      } catch (error) {
        console.error("Failed to load KYC providers:", error);
        setAvailableProviders(["digilocker"]);
        setChosenProvider("digilocker");
      } finally {
        setProvidersLoaded(true);
      }
    };

    fetchProviders();
  }, [operatorId]);

  // =========================================================
  // SCOREME (Aadhaar OTP) — synchronous, no popup/polling. Person stays
  // on this page: enter Aadhaar number, get OTP on their phone, enter
  // it here, done.
  // =========================================================

  const [scoremeAadhaarNumber, setScoremeAadhaarNumber] = useState("");
  const [scoremeOtp, setScoremeOtp] = useState("");
  const [scoremeOtpSent, setScoremeOtpSent] = useState(false);
  const [scoremeSendingOtp, setScoremeSendingOtp] = useState(false);
  const [scoremeVerifying, setScoremeVerifying] = useState(false);
  // Mirrors ScoreMe's own 120-second resend window (EAS517) — purely a
  // UI courtesy so "Resend OTP" isn't clickable during that window;
  // ScoreMe's own API is still the actual enforcement.
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

  // =========================================================
  // CUSTOMER DETAILS
  // =========================================================

  const [firstName, setFirstName] = useState(
    existingUser?.name || ""
  );

  const [lastName, setLastName] = useState(
    existingUser?.lastName || ""
  );

  const [gender, setGender] = useState("");

  const [dob, setDob] = useState("");

  const [billingAddress, setBillingAddress] = useState("");

  const [installationAddress, setInstallationAddress] =
    useState("");

  const [email, setEmail] = useState(
    existingUser?.EmailId || ""
  );

  // =========================================================
  // INTERNET PLANS
  // =========================================================

  const [packages, setPackages] = useState([]);

  const [selectedPackage, setSelectedPackage] = useState(null);

  const [subPlans, setSubPlans] = useState([]);

  const [selectedSubPlanId, setSelectedSubPlanId] =
    useState("");

  // =========================================================
  // SUBMIT
  // =========================================================

  const [submitting, setSubmitting] = useState(false);

  // =========================================================
  // LOAD EXISTING INTERNET PACKAGES
  // =========================================================

  useEffect(() => {

    if (!operatorId) {

      setPackages([]);
      setSelectedPackage(null);
      setSubPlans([]);
      setSelectedSubPlanId("");

      return;
    }

    const fetchPackages = async () => {

      try {

        const { data } = await apiClient.get(
          `/customer/get_internet_plans.php?operator_id=${operatorId}`
        );

        if (!data.success) {

          setPackages([]);
          setSelectedPackage(null);
          setSubPlans([]);
          setSelectedSubPlanId("");

          toast.error(
            data.error ||
            "Failed to load internet packages"
          );

          return;
        }

        const plans = data.plans || [];

        setPackages(plans);

        // Keep whatever's currently selected (e.g. across a re-fetch)
        // if it still exists in the new list; otherwise clear it.
        setSelectedPackage((currentPackage) => {

          if (!currentPackage?.id) {
            return null;
          }

          const restoredPackage = plans.find(
            (p) =>
              String(p.id) ===
              String(currentPackage.id)
          );

          return restoredPackage || null;
        });

      } catch (error) {

        console.error(
          "Failed to load internet packages:",
          error
        );

        setPackages([]);
        setSelectedPackage(null);
        setSubPlans([]);
        setSelectedSubPlanId("");

        toast.error(
          "Failed to load internet packages"
        );
      }

    };

    fetchPackages();

  }, [operatorId]);

  // =========================================================
  // LOAD SUB-PLANS FOR SELECTED PACKAGE
  // =========================================================

  useEffect(() => {

    if (
      !selectedPackage ||
      !selectedPackage.id ||
      !operatorId
    ) {

      setSubPlans([]);
      return;
    }

    const fetchSubPlans = async () => {

      setSubPlans([]);

      try {

        const { data } = await apiClient.get(
          `/customer/internet_subplans.php?package_id=${selectedPackage.id}&operator_id=${operatorId}`
        );

        if (!data.success) {

          setSubPlans([]);
          setSelectedSubPlanId("");

          toast.error(
            data.error ||
            "No sub-plans found"
          );

          return;
        }

        const availableSubPlans =
          data.sub_plans || [];

        setSubPlans(
          availableSubPlans
        );

        setSelectedSubPlanId((currentId) => {

          if (!currentId) {
            return "";
          }

          const exists =
            availableSubPlans.some(
              (sp) =>
                String(sp.id) ===
                String(currentId)
            );

          return exists
            ? String(currentId)
            : "";
        });

      } catch (error) {

        console.error(
          "Failed to load sub-plans:",
          error
        );

        setSubPlans([]);
        setSelectedSubPlanId("");

        toast.error(
          "Failed to load sub-plans"
        );
      }

    };

    fetchSubPlans();

  }, [
    selectedPackage,
    operatorId
  ]);

  // =========================================================
  // VERIFY BUTTON CONDITION
  // =========================================================

  const canVerify =
    username.trim() !== "" &&
    password.trim() !== "" &&
    /^[0-9]{10}$/.test(mobile) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    !!selectedPackage?.id &&
    selectedSubPlanId !== "";

  // =========================================================
  // DIGILOCKER: POPUP + POLL
  // =========================================================

  const stopPolling = () => {
    setPolling(false);
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const applyVerificationResult = (result) => {
    setVerification(result);

    const c = result.customer || {};
    const nameParts = (c.full_name || "").trim().split(/\s+/);
    const first = nameParts.shift() || "";
    const last = nameParts.join(" ");

    setFirstName((prev) => prev || first);
    setLastName((prev) => prev || last);
    setGender(
      c.gender === "M" ? "male" : c.gender === "F" ? "female" : ""
    );
    setDob(c.dob || "");
    setBillingAddress(c.full_address || "");
    setInstallationAddress((prev) => prev || c.full_address || "");

    toast.success("Aadhaar verification successful ✅");
  };

  const pollOnce = async (clientId) => {
    try {
      const { data } = await apiClient.post(
        "/customer/digilocker_download_aadhaar.php",
        { client_id: clientId }
      );

      if (data.success) {
        stopPolling();
        applyVerificationResult(data);
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        return;
      }

      scheduleNextPoll(clientId);
    } catch (error) {
      console.error("DigiLocker poll error:", error);
      scheduleNextPoll(clientId);
    }
  };

  const pollOnceFinal = async (clientId) => {
    try {
      const { data } = await apiClient.post(
        "/customer/digilocker_download_aadhaar.php",
        { client_id: clientId }
      );

      if (data.success) {
        applyVerificationResult(data);
      } else {
        toast.info("Verification window was closed before completing.");
      }
    } catch (error) {
      console.error("DigiLocker final poll error:", error);
      toast.error("Unable to confirm verification status.");
    } finally {
      stopPolling();
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
      pollTimerRef.current = setTimeout(() => {
        pollOnceFinal(clientId);
      }, 1500);
      return;
    }

    const elapsed = Date.now() - (pollDeadlineRef.current - POLL_TIMEOUT_MS);
    const nextInterval = elapsed < EARLY_WINDOW_MS ? POLL_INTERVAL_MS_EARLY : POLL_INTERVAL_MS_LATE;

    pollTimerRef.current = setTimeout(() => pollOnce(clientId), nextInterval);
};

  const handleVerifyAadhaar = async () => {

    if (!canVerify) {

      toast.error(
        "Enter username, mobile number, password, package, and sub-plan first"
      );

      return;
    }

    if (starting || polling) {
      return;
    }

    // Open a blank popup synchronously (on the click itself) so browsers
    // don't treat it as an unrequested popup once the fetch below
    // resolves — we point its location at the real URL after we have it.
    const popup = window.open(
      "",
      "digilocker_verify",
      "width=480,height=720"
    );

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

        toast.error(
          data.error ||
          "Unable to start verification"
        );

        popup.close();
        return;
      }

      popup.location.href = data.url;
      popupRef.current = popup;

      setPolling(true);
      pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;
      pollTimerRef.current = setTimeout(
        () => pollOnce(data.client_id),
        POLL_INTERVAL_MS_EARLY   // ← was POLL_INTERVAL_MS
      );

    } catch (error) {

      console.error(
        "DigiLocker initialization error:",
        error
      );

      toast.error(
        "Unable to start verification"
      );

      popup.close();

    } finally {

      setStarting(false);
    }
  };

  const handleCancelVerification = () => {
    stopPolling();
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
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

      // Same shape as DigiLocker's success response — this is what lets
      // applyVerificationResult() work unchanged regardless of provider.
      applyVerificationResult(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "OTP verification failed");
    } finally {
      setScoremeVerifying(false);
    }
  };

  // =========================================================
  // FINAL VALIDATION
  // =========================================================

  const validate = () => {

    if (!verification?.verification_id) {

      toast.error(
        "Please verify Aadhaar first"
      );

      return false;
    }

    if (!firstName.trim()) {

      toast.error(
        "First name is required"
      );

      return false;
    }

    if (!lastName.trim()) {

      toast.error(
        "Last name is required"
      );

      return false;
    }

    if (!installationAddress.trim()) {

      toast.error(
        "Installation address is required"
      );

      return false;
    }

    if (!selectedPackage?.id) {

      toast.error(
        "Please select a package"
      );

      return false;
    }

    if (!selectedSubPlanId) {

      toast.error(
        "Please select a sub-plan"
      );

      return false;
    }

    return true;
  };

  // =========================================================
  // ADD INTERNET CUSTOMER
  // =========================================================

  const handleSubmit = async () => {

    if (!validate()) {
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {

      const res = await apiClient.post(
        "/customer/add_internet_customer.php",
        {

          user_id:
            mode === "link"
              ? existingUser.id
              : null,

          operator_id:
            operatorId,

          verification_id:
            verification.verification_id,

          package_id:
            selectedPackage.id,

          sub_plan_id:
            selectedSubPlanId,

          username,

          password,

          mobile,

          email,

          first_name:
            firstName,

          last_name:
            lastName,

          installation_address:
            installationAddress

        },
        {
          responseType: "text",
          validateStatus: () => true,
        }
      );

      let data;

      try {

        data =
          typeof res.data === "string" ? JSON.parse(res.data) : res.data;

      } catch (error) {

        console.error(
          "Non-JSON response:",
          res.data
        );

        toast.error(
          "Server returned an invalid response"
        );

        return;
      }

      if (
        res.status < 200 || res.status >= 300 ||
        !data.success
      ) {

        toast.error(
          data.error ||
          "Failed to add Internet customer"
        );

        return;
      }

      toast.success(
        "Internet account created successfully"
      );

      onSuccess?.(data);

    } catch (error) {

      console.error(
        "Add Internet Customer error:",
        error
      );

      toast.error(
        "Server error while adding customer"
      );

    } finally {

      setSubmitting(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="internet-customer-form">

      {/* =====================================================
          STEP 1
          ===================================================== */}

      {!verification && (
        <>

          {/* =================================================
              PACKAGE DROPDOWN
              ================================================= */}
          <label>Package</label>
          <select
            value={
              selectedPackage?.id || ""
            }
            onChange={(e) => {

              const packageId =
                e.target.value;

              const packageObject =
                packages.find(
                  (p) =>
                    String(p.id) ===
                    String(packageId)
                ) || null;

              setSelectedPackage(
                packageObject
              );

              setSelectedSubPlanId("");

              setSubPlans([]);

            }}
            disabled={
              packages.length === 0 || polling
            }
          >

            <option value="">
              -- Select Package --
            </option>

            {packages.map((p) => (

              <option
                key={p.id}
                value={p.id}
              >
                {p.plan_name}
              </option>

            ))}

          </select>

          {/* =================================================
              SUB PLAN DROPDOWN
              ================================================= */}
          <label>Sub Plan</label>
          <select
            value={
              selectedSubPlanId
            }
            onChange={(e) =>
              setSelectedSubPlanId(
                e.target.value
              )
            }
            disabled={
              !selectedPackage ||
              subPlans.length === 0 ||
              polling
            }
          >

            <option value="">
              -- Select Sub Plan --
            </option>

            {subPlans.map((sp) => (

              <option
                key={sp.id}
                value={sp.id}
              >
                {sp.name} — ₹{sp.price}
              </option>

            ))}

          </select>

          {/* NO PACKAGES */}

          {operatorId &&
            packages.length === 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: "#999"
                }}
              >
                No Internet packages are
                available for this operator.
              </p>
            )}

          {/* NO SUB PLANS */}

          {selectedPackage &&
            subPlans.length === 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: "#999"
                }}
              >
                No sub-plans are available
                for this package.
              </p>
            )}


          <label>Username</label>
          <input
            placeholder="Internet Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            disabled={polling}
          />

          {/* PASSWORD */}
          <label>Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={polling}
            />

            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={polling}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* MOBILE */}
          <label>Mobile Number</label>
          <input
            placeholder="Mobile Number"
            value={mobile}
            maxLength={10}
            onChange={(e) =>
              setMobile(
                e.target.value.replace(
                  /\D/g,
                  ""
                )
              )
            }
            readOnly={
              mode === "link" || polling
            }
          />

          <label>Email ID</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={polling}
            required
          />


          {/* =================================================
              VERIFY AADHAAR — provider picker (only shown when the
              operator has more than one KYC provider assigned), then
              whichever provider's own flow.
              ================================================= */}

          {providersLoaded && availableProviders.length > 1 && !chosenProvider && (
            <div className="kyc-provider-picker">
              <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                Choose how to verify Aadhaar:
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="aadhaar-btn"
                  onClick={() => setChosenProvider("digilocker")}
                  disabled={!canVerify}
                >
                  🪪 DigiLocker
                </button>
                <button
                  type="button"
                  className="aadhaar-btn"
                  onClick={() => setChosenProvider("scoreme")}
                  disabled={!canVerify}
                >
                  📱 Aadhaar OTP
                </button>
              </div>
              {!canVerify && (
                <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
                  Enter username, mobile number, password, email, package and sub-plan
                  to continue.
                </p>
              )}
            </div>
          )}

          {chosenProvider === "digilocker" && (
            !polling ? (
              <button
                type="button"
                disabled={
                  !canVerify ||
                  starting
                }
                onClick={
                  handleVerifyAadhaar
                }
                className="aadhaar-btn"
              >

                {starting
                  ? "Starting verification..."
                  : "🪪 Verify Aadhaar"}

              </button>
            ) : (
              <div className="digilocker-waiting-box">
                <span className="digilocker-spinner" />
                <p>Waiting for Aadhaar verification…</p>
                <p style={{ fontSize: 13, color: "#888" }}>
                  Waiting for Aadhaar verification in the opened window...
                  This page will update automatically once you're done...
                </p>
                <button type="button" onClick={handleCancelVerification} className="cancle-btn">
                  Cancel Verification
                </button>
              </div>
            )
          )}

          {chosenProvider === "scoreme" && (
            <div className="scoreme-otp-box">
              <label>Aadhaar Number</label>
              <input
                placeholder="12-digit Aadhaar number"
                value={scoremeAadhaarNumber}
                maxLength={12}
                onChange={(e) => setScoremeAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                disabled={scoremeOtpSent || scoremeVerifying}
              />

              {!scoremeOtpSent ? (
                <button
                  type="button"
                  className="aadhaar-btn"
                  disabled={!canVerify || scoremeSendingOtp || !/^\d{12}$/.test(scoremeAadhaarNumber)}
                  onClick={handleScoremeSendOtp}
                >
                  {scoremeSendingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <>
                  <label>Enter OTP</label>
                  <input
                    placeholder="OTP sent to the registered mobile"
                    value={scoremeOtp}
                    onChange={(e) => setScoremeOtp(e.target.value.replace(/\D/g, ""))}
                    disabled={scoremeVerifying}
                  />
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      type="button"
                      className="aadhaar-btn"
                      disabled={scoremeVerifying || !scoremeOtp.trim()}
                      onClick={handleScoremeVerifyOtp}
                    >
                      {scoremeVerifying ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
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
                  type="button"
                  className="cancel-btn"
                  style={{ marginTop: 8 }}
                  onClick={() => { setChosenProvider(null); setScoremeOtpSent(false); setScoremeOtp(""); }}
                >
                  ← Choose a different verification method
                </button>
              )}
            </div>
          )}

          {/* WHY BUTTON IS DISABLED — only relevant once a single-provider
              flow is actually showing; the picker above has its own
              equivalent message. */}

          {chosenProvider && !canVerify && !polling && (
            <p
              style={{
                fontSize: 13,
                color: "#888"
              }}
            >
              Enter username, mobile number,
              password, email, package and sub-plan
              to continue.
            </p>
          )}

          {/* CANCEL */}

          {onCancel && !polling && (
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}

        </>
      )}

      {/* =====================================================
          STEP 2 — AADHAAR VERIFIED
          ===================================================== */}

      {verification && (
        <>

          <p
            style={{
              color: "green"
            }}
          >
            ✔ Aadhaar verified —{" "}
            {
              verification.customer
                ?.masked_aadhaar
            }
          </p>

          {/* FIRST NAME */}
          <label>First Name</label>
          <input
            placeholder="First Name"
            value={firstName}
            onChange={(e) =>
              setFirstName(
                e.target.value
              )
            }
          />

          {/* LAST NAME */}
          <label>Last Name</label>
          <input
            placeholder="Last Name"
            value={lastName}
            onChange={(e) =>
              setLastName(
                e.target.value
              )
            }
          />

          {/* GENDER */}
          <label>Gender</label>
          <select
            value={gender}
            onChange={(e) =>
              setGender(
                e.target.value
              )
            }
          >

            <option value="">
              -- Gender --
            </option>

            <option value="male">
              Male
            </option>

            <option value="female">
              Female
            </option>

          </select>

          {/* DOB */}
          <label>Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) =>
              setDob(
                e.target.value
              )
            }
          />

          {/* BILLING ADDRESS */}
          <label>Billing Address</label>
          <div>

            <label
              style={{
                fontSize: 13,
                color: "#666"
              }}
            >
              Billing Address (from Aadhaar)
            </label>

            <textarea
              value={
                billingAddress
              }
              readOnly
              rows={2}
            />

          </div>

          {/* INSTALLATION ADDRESS */}
          <label>Installation Address</label>
          <div>

            <label
              style={{
                fontSize: 13,
                color: "#666"
              }}
            >
              Installation Address
            </label>

            <textarea
              value={
                installationAddress
              }
              onChange={(e) =>
                setInstallationAddress(
                  e.target.value
                )
              }
              rows={2}
            />

          </div>

          {/* EMAIL */}
          <label>Email ID</label>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />

          {/* =================================================
              PACKAGE
              ================================================= */}
          <label>Package</label>
          <select
            value={
              selectedPackage?.id || ""
            }
            onChange={(e) => {

              const packageId =
                e.target.value;

              const packageObject =
                packages.find(
                  (p) =>
                    String(p.id) ===
                    String(packageId)
                ) || null;

              setSelectedPackage(
                packageObject
              );

              setSelectedSubPlanId("");

              setSubPlans([]);

            }}
          >

            <option value="">
              -- Select Package --
            </option>

            {packages.map((p) => (

              <option
                key={p.id}
                value={p.id}
              >
                {p.plan_name}
              </option>

            ))}

          </select>

          {/* =================================================
              SUB PLAN
              ================================================= */}
          <label>Sub Plan</label>
          <select
            value={
              selectedSubPlanId
            }
            onChange={(e) =>
              setSelectedSubPlanId(
                e.target.value
              )
            }
            disabled={
              !selectedPackage ||
              subPlans.length === 0
            }
          >

            <option value="">
              -- Select Sub Plan --
            </option>

            {subPlans.map((sp) => (

              <option
                key={sp.id}
                value={sp.id}
              >
                {sp.name} — ₹{sp.price}
              </option>

            ))}

          </select>

          <label>Username</label>
          <input
            placeholder="Internet Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            disabled={polling}
          />

          {/* PASSWORD */}
          <label>Password</label>

          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={polling}
            />

            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          

          {/* =================================================
              FINAL SUBMIT
              ================================================= */}

          <div className="add-cancel">

            <button
              type="button"
              disabled={
                submitting ||
                !selectedPackage?.id ||
                !selectedSubPlanId
              }
              onClick={
                handleSubmit
              }
              className="add-customer-btn"
            >

              {submitting
                ? "Creating..."
                : "Add Internet Customer"}

            </button>

            {onCancel && (
              <button
                type="button"
                className="cancel-btn"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}

          </div>

        </>
      )}

    </div>
  );
};

export default InternetCustomerForm;

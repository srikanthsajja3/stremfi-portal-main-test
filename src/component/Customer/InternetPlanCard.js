import React, { useEffect, useState } from "react";
import "./InternetPlanCard.css";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";
import defaultProfilePic from '../images/user.png';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";


const InternetPlanCard = ({
  user,
  internetInfo,
  loading,
  onRecharge,
  onLinkAccount,
  onRemoveMac,
  onSessionHistory,
  onPassword,
  onChangeVerification,
  onVerifyAadhaar
}) => {
  const customerExists =
    internetInfo?.status === 200 &&
    internetInfo?.results &&
    typeof internetInfo.results === "object";

  const data = customerExists ? internetInfo.results : {};

  const parseExpiry = (expiry) => {
    if (!expiry) return null;

    // SQL format
    const sqlDate = new Date(expiry.replace(" ", "T"));
    if (!isNaN(sqlDate.getTime())) {
      return sqlDate;
    }

    // 25 Aug, 2026 12:09 am
    const match = expiry.match(
      /^(\d{1,2})\s([A-Za-z]{3}),\s(\d{4})\s+(\d{1,2}):(\d{2})\s(am|pm)$/i
    );

    if (!match) return null;

    const [, day, mon, year, hourStr, min, ampm] = match;

    const months = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    let hour = parseInt(hourStr);

    if (ampm.toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (ampm.toLowerCase() === "am" && hour === 12) hour = 0;

    return new Date(
      parseInt(year),
      months[mon],
      parseInt(day),
      hour,
      parseInt(min)
    );
  };

  const [profilePicURL, setProfilePicURL] = useState(null);
  const [idProofURL, setIdProofURL] = useState(null);
  const [addressProofURL, setAddressProofURL] = useState(null);

  useEffect(() => {
    if (!customerExists) {
      setProfilePicURL(null);
      setIdProofURL(null);
      setAddressProofURL(null);
      return;
    }

    // Profile picture
    if (data.profile_pic?.includes("https://vrplay.in")) {
      setProfilePicURL(data.profile_pic);
    } else {
      setProfilePicURL(data.profile_pic_url || null);
    }

    // ID proof
    if (data.id_proof?.includes("https://vrplay.in")) {
      setIdProofURL(data.id_proof);
    } else {
      setIdProofURL(data.id_proof_url || null);
    }

    // Address proof
    if (data.address_proof?.includes("https://vrplay.in")) {
      setAddressProofURL(data.address_proof);
    } else {
      setAddressProofURL(data.address_proof_url || null);
    }
  }, [
    customerExists,
    data.profile_pic,
    data.profile_pic_url,
    data.id_proof,
    data.id_proof_url,
    data.address_proof,
    data.address_proof_url
  ]);

  const isActive = (expiry) => {
    const parsed = parseExpiry(expiry);
    if (!parsed) return false;
    return parsed >= new Date();
  };

  const formatDate = (date) => {
    const parsed = parseExpiry(date);

    if (!parsed) return "--";

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const active = data.status === 1 && isActive(data.expiration || data.expiry_date);

  return (
    <div className="internet-plan-card">
      {!customerExists && (
        <div className="internet-empty-state">
          <div className="internet-empty-icon">🌐</div>
          <p className="internet-empty-title">
            No Internet / Broadband connection linked
          </p>
          <p className="internet-empty-subtitle">
            Link this customer to an Internet account to manage broadband services.
          </p>
          <button
            className="internet-btn-primary"
            onClick={onLinkAccount}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="internet-spinner-small"></span>
                Checking...
              </>
            ) : (
              "🔗 Link Internet Account"
            )}
          </button>
        </div>
      )}

      {customerExists && (
        <>
          {/* HEADER */}
          <div className="internet-dashboard-header">
            <div className="internet-dashboard-left">
              <div className="internet-big-icon">

                <img
                  src={profilePicURL || defaultProfilePic}
                  alt="Customer"
                  className="internet-profile-pic"
                  onError={(e) => {
                    e.currentTarget.src = defaultProfilePic;
                  }}
                />

              </div>
              <div>
                <div className="internet-header-subtitle">
                  <span className="internet-copy">

                    <strong>Username:</strong> {data.username_org}
                    &nbsp;&nbsp;
                    <ContentCopyIcon
                      className="copy-icon"
                      fontSize="small"
                      onClick={() => {

                        navigator.clipboard
                          .writeText(data.username_org)
                          .then(() => {

                            toast.success(
                              "Username copied!"
                            );

                          })
                          .catch(() => {

                            toast.error(
                              "Unable to copy."
                            );

                          });

                      }}
                    />

                  </span>
                  <span>
                    <strong>Account ID:</strong> {data.acc_id}
                  </span>
                </div>
                <div className="internet-header-subtitle">
                  <span>
                    <strong>Mobile:</strong> {data.mobile}
                  </span>
                </div>
                <div className="internet-header-subtitle">
                  <span>
                    <strong>Expiry Date:</strong> {data.expiry_date ? formatDate(data.expiry_date) : "--"}
                  </span>
                </div>
              </div>
            </div>
            <div className="internet-dashboard-right">
              <span
                className={`internet-status-badge ${data.online === "ONLINE"
                  ? "online"
                  : "offline"
                  }`}
              >

                <span className="status-dot"></span>

                {data.online}

              </span>
              <span
                className={`internet-status-badge ${data.status === 1 ? "active" : "warning"
                  }`}
              >
                {data.status_text}
              </span>
            </div>
          </div>

          {/* ACTIONS TOOLBAR */}
          <div className="internet-toolbar">
            {data.aadhar_verified === 0 && (
              <button className="internet-btn-secondary" onClick={onVerifyAadhaar}>
                ✔ Verify Aadhaar
              </button>
            )}
            {data.verified !== "Verified" && (
              <button className="internet-btn-secondary" onClick={onChangeVerification}>
                ✔ Verify Customer
              </button>
            )}
            {data.verified === "Verified" && data.aadhar_verified === 1 && (
              !active ? (
                <button
                  className="internet-btn-recharge"
                  disabled={loading}
                  onClick={() => onRecharge(false)}
                >
                  Recharge
                </button>
              ) : (
                <button
                  className="internet-btn-advance"
                  disabled={loading}
                  onClick={() => onRecharge(true)}
                >
                  Advance Renewal
                </button>
              ))}
            <button className="internet-btn-secondary" onClick={onPassword}>
              🔑 Password
            </button>
            <button className="internet-btn-secondary" onClick={onRemoveMac}>
              🌐 Remove MAC
            </button>
            <button className="internet-btn-secondary" onClick={onSessionHistory}>
              📊 Session History
            </button>
            {user.role === "superadmin" && <select
              className="internet-select"
              defaultValue=""
              onChange={(e) => {

                if (!e.target.value) return;

                window.open(
                  e.target.value,
                  "_blank"
                );

                e.target.value = "";

              }}
            >

              <option value="">
                📄 Documents
              </option>

              {data.id_proof && (
                <option
                  value={`${idProofURL}`}
                >
                  ID Proof
                </option>
              )}

              {data.address_proof && (
                <option
                  value={`${addressProofURL}`}
                >
                  Address Proof
                </option>
              )}

            </select>}
          </div>

          {/* DASHBOARD GRID */}
          <div className="internet-dashboard-grid">
            {/* Account Details */}
            <div className="internet-dashboard-card">
              <h3>👤 Account Details</h3>
              <div className="internet-detail-row">
                <span>Username</span>
                <strong>{data.username_org}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Customer</span>
                <strong>
                  {[data.firstname, data.lastname].filter(Boolean).join(" ")}
                </strong>
              </div>
              <div className="internet-detail-row">
                <span>Email</span>
                <strong>{data.email || "--"}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Mobile</span>
                <strong
                  style={{
                    color: data.mobile_verify === "Verified" ? "#2e7d32" : "#f50000",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {data.mobile}
                  {data.mobile_verify === "Verified" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                </strong>
              </div>
              <div className="internet-detail-row">
                <span>Customer Verification</span>
                <strong
                  style={{
                    color: data.verified === "Verified" ? "#2e7d32" : "#f50000",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {data.verified}
                  {data.verified === "Verified" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                </strong>
              </div>
              <div className="internet-detail-row">
                <span>Aadhar Verification</span>
                <strong
                  style={{
                    color: data.aadhar_verified === 1 ? "#2e7d32" : "#f50000",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {data.aadhar_verified === 1 ? "Verified" : "UnVerified"}
                  {data.aadhar_verified === 1 ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                </strong>
              </div>
              <div className="internet-detail-row">
                <span>Aadhar Verification Date</span>
                <strong>{data.aadhar_verified_time === "" ? <p>-- &nbsp;&nbsp;</p> : data.aadhar_verified_time}</strong>
              </div>
            </div>

            {/* Package Details */}
            <div className="internet-dashboard-card">
              <h3>📦 Package Details</h3>
              <div className="internet-detail-row">
                <span>Package</span>
                <strong>{data.package}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Sub Plan</span>
                <strong>{data.sub_plan}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Expiry</span>
                <strong>{formatDate(data.expiry_date)}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Balance</span>
                <strong>
                  ₹ {Number(data.balance || 0).toFixed(2)}
                  {data.balance_text ? ` (${data.balance_text})` : ""}
                </strong>
              </div>
              <div className="internet-detail-row">
                <span>Status</span>
                <strong>{data.status_text}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Invoice</span>
                <strong>₹ {Number(data.total_invoice_amount || 0).toFixed(2)}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Paid</span>
                <strong>₹ {Number(data.paid_amount || 0).toFixed(2)}</strong>
              </div>
            </div>

            {/* Connection Details */}
            <div className="internet-dashboard-card">
              <h3>🌐 Connection Details</h3>
              <div className="internet-detail-row">
                <span>Online Status</span>
                <strong
                  style={{
                    color: data.online === "ONLINE" ? "#2e7d32" : "#c62828"
                  }}
                >
                  {data.online || "--"}
                </strong>
              </div>
              <div className="internet-detail-row">
                <span>Activation Date</span>
                <strong>{data.activation_date || "--"}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Last Logout</span>
                <strong>{data.last_log_off || "--"}</strong>
              </div>
              <div className="internet-detail-row">
                <span>State</span>
                <strong>{data.state || "--"}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Customer Type</span>
                <strong>{data.customer_type || "--"}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Simultaneous Use</span>
                <strong>{data.simultanious_use || "--"}</strong>
              </div>
              <div className="internet-detail-row">
                <span>Subscription</span>
                <strong>
                  {data.subscription_type === 0 ? "Prepaid" : "Postpaid"}
                </strong>
              </div>
            </div>
          </div>

          {/* ADDRESS INFORMATION */}
          <div className="internet-dashboard-card internet-address-card">
            <h3>📍 Address Information</h3>
            <div className="internet-address-grid">
              <div>
                <h4>Billing Address</h4>
                <p>{data.billing_address || "--"}</p>
              </div>
              <div>
                <h4>Installation Address</h4>
                <p>{data.installation_address || "--"}</p>
              </div>
            </div>
          </div>


        </>
      )}
    </div>
  );
};

export default InternetPlanCard;
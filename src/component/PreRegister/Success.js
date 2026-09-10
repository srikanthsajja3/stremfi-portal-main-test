import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ASSET_BASE_URL } from "../../config/env";
import './Success.css';

export default function Success() {
  const [data, setData] = useState(null);
  const [selectedOtts, setSelectedOtts] = useState([]);

  // OTT Plans Data (matching the PreRegister component)
  const ottPlans = {
    1: {
      name: "Entertainment Pack 1",
      otts: ["VRPLAY", "Hotstar", "Discovery+"],
      description: "Install OTTPlay app to access all content"
    },
    2: {
      name: "Entertainment Pack 2",
      otts: ["VRPLAY", "AHA", "ETV WIN", "SUNNXT", "Discovery+"],
      description: "Install OTTPlay app to access all content"
    },
    3: {
      name: "Entertainment Pack 3",
      otts: ["VRPLAY", "Amazon Prime Lite"],
      description: "Amazon Prime Lite included"
    }
  };

  // Helper function to get OTT image name
  const getOttImageName = (ottName) => {
    const ottImageMap = {
      "VRPLAY": "vrplay",
      "Hotstar": "jiohotstar",
      "Discovery+": "discoveryplus",
      "AHA": "aha",
      "ETV WIN": "etv win",
      "SUNNXT": "sunnxt",
      "Amazon Prime Lite": "amazonprimelite"
    };
    return ottImageMap[ottName] || ottName.toLowerCase().replace(/[+\s]/g, '');
  };

  useEffect(() => {
    const d = localStorage.getItem("vrplay_prereg");
    if (!d) {
      window.location.href = "/";
      return;
    }
    const parsedData = JSON.parse(d);
    setData(parsedData);
    
    // Set selected OTTs based on plan
    if (parsedData.plan) {
      setSelectedOtts(ottPlans[parsedData.plan]?.otts || []);
    }
  }, []);

  if (!data) return null;

  // Get current plan details
  const currentPlan = ottPlans[data.plan] || { 
    name: "Selected Plan", 
    otts: selectedOtts 
  };

  return (
    <div className="success-page">
      <div className="particles"></div>
      <div className="gradient-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="success-container">
        {/* Success Badge */}
        <div className="success-badge">
          <div className="checkmark-circle">
            <div className="checkmark">✓</div>
          </div>
        </div>

        {/* Success Header */}
        <div className="success-header">
          <h1 className="success-title">
            <span className="title-gradient">Registration Successful!</span>
          </h1>
          <div className="title-underline"></div>
          <p className="success-subtitle">
            Thank you for pre-registering with VRPLAY
          </p>
        </div>

        {/* Celebration Animation */}
        <div className="celebration-animation">
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
        </div>

        {/* Main Content Card */}
        <div className="success-card">
          {/* Welcome Message */}
          <div className="welcome-message">
            <span className="wave-emoji">👋</span>
            <h2>Welcome, {data.firstName} {data.lastName}!</h2>
          </div>

          {/* Selected OTTs Section */}
          <div className="otts-section">
            <h3 className="section-title">
              <span className="title-icon">🎬</span>
              Your Entertainment Pack
            </h3>
            
            <div className="plan-name-badge">
              {currentPlan.name}
            </div>

            <div className="otts-grid-images">
              {selectedOtts.map((ott, index) => (
                <div key={index} className="ott-card-image">
                  <div className="ott-image-wrapper">
                    <img 
                      src={`${ASSET_BASE_URL}/${getOttImageName(ott)}.png`}
                      alt={ott}
                      className="ott-display-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/80x80/6366f1/ffffff?text=${ott.charAt(0)}`;
                      }}
                    />
                    <div className="ott-image-tooltip">{ott}</div>
                  </div>
                  <div className="ott-info">
                    <span className="ott-name-display">{ott}</span>
                    <span className="ott-status-badge">✓ Included</span>
                  </div>
                </div>
              ))}
            </div>

            {currentPlan.description && (
              <p className="plan-description">
                ℹ️ {currentPlan.description}
              </p>
            )}
          </div>

          {/* Login Credentials */}
          <div className="credentials-section">
            <h3 className="section-title">
              <span className="title-icon">🔑</span>
              VRPLAY Login Credentials
            </h3>
            
            <div className="credentials-grid">
              <div className="credential-item">
                <span className="credential-label">📱 Phone Number</span>
                <span className="credential-value">{data.phone}</span>
                <button 
                  className="copy-button"
                  onClick={() => navigator.clipboard.writeText(data.phone)}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>

              <div className="credential-item highlight">
                <span className="credential-label">🔑 Password</span>
                <span className="credential-value password">VRPlay123</span>
                <button 
                  className="copy-button"
                  onClick={() => navigator.clipboard.writeText("VRPlay123")}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
          </div>

          {/* Activation Status */}
          <div className="activation-status">

            <p className="activation-message">
              ⚡ Our team will activate your account within 24 hours
            </p>
          </div>
          
        </div>

      </div>
    </div>
  );
}
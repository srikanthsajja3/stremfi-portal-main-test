import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/client";
import { ASSET_BASE_URL } from "../../config/env";
import './PreRegister.css';

export default function PreRegister() {
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showTerms,setShowTerms]=useState(false);
  const [regCount,setRegCount]=useState(0);


  if(localStorage.getItem("vrplay_prereg")){
    window.location.href="/success";
  }

  useEffect(()=>{
    apiClient.get("/dashboard/get_prereg_count.php")
      .then(r=>r.data)
      .then(d=>setRegCount(d.count))
  },[]);


  // OTT Plans Data
  const allPlans = [
    {
      id:1,
      name:"Entertainment Pack 1",
      otts:["VRPLAY","Hotstar","Discovery+"],
      description:"Install OTTPlay app to access all content"
    },
    {
      id:2,
      name:"Entertainment Pack 2",
      otts:["VRPLAY","AHA","ETV WIN","SUNNXT","Discovery+"],
      description:"Install OTTPlay app to access all content"
    },
    {
      id:3,
      name:"Entertainment Pack 3",
      otts:["VRPLAY","Amazon Prime Lite"],
      description:"Amazon Prime Lite included"
    }
  ];

    const ottPlans = regCount < 200 ? allPlans : [
    {
      id:4,
      name:"VRPLAY Starter Pack",
      otts:["VRPLAY"],
      description:"VRPLAY exclusive pack"
    }
  ];


  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "plan") {
      setSelectedPlan(e.target.value);
    }
  };

  const selectPlan = (planId) => {
    setSelectedPlan(planId);
    setForm({ ...form, plan: planId });
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert("Please upload the Play Store pre-registration screenshot");
      return;
    }

    if (!selectedPlan) {
      alert("Please select a plan");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const fd = new FormData();
    Object.keys(form).forEach(k => fd.append(k, form[k]));
    fd.append("screenshot", file);

    try {
      const { data: j } = await apiClient.post("/dashboard/pre_register.php", fd);

      // Save data locally
      localStorage.setItem("vrplay_prereg", JSON.stringify({
        firstName: form.firstName,
        phone: form.phone,
        plan: selectedPlan
      }));

      // Redirect to success page
      window.location.href = "/success";

    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: 'Registration failed. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get lowercase OTT name for image URL
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

  return (
    <div className="prereg-page">
      <div className="particles"></div>
      <div className="gradient-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="prereg-container">
        <Link to="/" className="back-home">
          <span className="back-arrow">←</span> Back to Home
        </Link>

        <div className="prereg-header">
          
          <div className="launch-badge">
            <span className="pulse-badge">🎉 LAUNCHING TODAY ON PLAY STORE</span>
          </div>

          <div className="offer-card">
            <div className="offer-icon">🎁</div>
            <div className="offer-content">
              <p className="launch-text">
                <span className="highlight-text">FREE Activation</span> for first 200 users!
                <br />
                <span className="offer-terms">Pre-register now*</span>
              </p>
            </div>
          </div>

          {regCount >= 100 && (
            <div className="reg-count"> 
              🔥 {regCount} users already pre-registered!
            </div>
          )}


          <h1 className="prereg-title">
            <span className="title-gradient">Choose Your Entertainment Pack</span>
            <div className="title-underline"></div>
          </h1>
          
          <div className="offer-summary">
            <div className="offer-chip">
              <span className="chip-icon">🎁</span>
              FREE Activation
            </div>
            <div className="offer-chip">
              <span className="chip-icon">⚡</span>
              Early Access
            </div>
            <div className="offer-chip">
              <span className="chip-icon">📺</span>
              500+ Live Channels
            </div>
          </div>

          <div className="deadline-notice">
            ⏰ Limited Time Offer • Pre-register before midnight
          </div>
        </div>

        {/* OTT Plans Section */}
        <div className="plans-section">
          <h2 className="plans-title">Select Your Preferred Plan</h2>
          <p className="plans-subtitle">Choose the entertainment pack that suits you best</p>
          
          <div className="plans-grid">
            {ottPlans.map((plan) => (
              <div 
                key={plan.id}
                className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
                onClick={() => selectPlan(plan.id)}
              >
                <div className="plan-header">
                  <div className="plan-radio">
                    <div className={`radio-circle ${selectedPlan === plan.id ? 'selected' : ''}`}>
                      {selectedPlan === plan.id && <div className="radio-dot"></div>}
                    </div>
                  </div>
                  <h3 className="plan-name">{plan.name}</h3>
                </div>

                <div className="plan-otts">
                  {plan.otts.map((ott, index) => (
                    <div key={index} className="ott-image-container">
                      <img 
                        src={`${ASSET_BASE_URL}/${getOttImageName(ott)}.png`}
                        alt={ott}
                        className="ott-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/60x60?text=' + ott.charAt(0);
                        }}
                      />
                      <div className="ott-name-tooltip">{ott}</div>
                    </div>
                  ))}
                </div>

                <p className="plan-description">{plan.description}</p>
              
              </div>
            ))}
          </div>
        </div>

        <div className="form-wrapper">
          <div className="form-header">
            <h2>Complete Your Registration</h2>
            <p className="form-subtitle">
              
            </p>
          </div>

          <form onSubmit={submit} className="prereg-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  <span className="label-icon">👤</span>
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  required
                  onChange={change}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  <span className="label-icon">👤</span>
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  required
                  onChange={change}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">
                  <span className="label-icon">📱</span>
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  required
                  onChange={change}
                  className="form-input"
                  pattern="[0-9]{10}"
                  maxLength="10"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  onChange={change}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">
                <span className="label-icon">🏠</span>
                Complete Address
              </label>
              <textarea
                id="address"
                name="address"
                placeholder="Enter your complete address"
                required
                onChange={change}
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pincode">
                  <span className="label-icon">📍</span>
                  Pin Code
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  placeholder="Enter 6-digit pin code"
                  required
                  onChange={change}
                  className="form-input"
                  pattern="[0-9]{6}"
                  maxLength="6"
                />
              </div>

              {/* Hidden select for form submission - will be set by plan selection */}
              <input type="hidden" name="plan" value={selectedPlan || ''} />
              
              <div className="form-group">
                <label htmlFor="plan">
                  <span className="label-icon">📦</span>
                  Selected Plan
                </label>
                <div className="selected-plan-display">
                  {selectedPlan ? (
                    <span className="selected-plan-text">
                      {ottPlans.find(p => p.id === selectedPlan)?.name}
                    </span>
                  ) : (
                    <span className="no-plan">Please select a plan above</span>
                  )}
                </div>
              </div>
            </div>

            <a
              href="https://play.google.com/store/apps/details?id=in.vrplay.tv"
              target="_blank"
              rel="noreferrer"
              className="download-button"
            >
              <span className="download-icon">📥</span>
              Pre-Register VRPLAY from Play Store
              <span className="button-arrow">→</span>
            </a>

            <div className="file-upload-section">
              <label className="file-upload-label">
                <span className="label-icon">📸</span>
                Upload Play Store Pre-Registration Screenshot
              </label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="screenshot"
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files[0])}
                  className="file-input"
                />
                <div className="file-upload-content">
                  <span className="upload-icon">📎</span>
                  <span className="upload-text">
                    {file ? file.name : 'Click or drag to upload screenshot'}
                  </span>
                  <span className="upload-hint">
                    Supported: JPG, PNG (Max 5MB)
                  </span>
                </div>
              </div>
            </div>

            {submitStatus && (
              <div className={`status-message ${submitStatus.type}`}>
                {submitStatus.type === 'success' ? '✅' : '❌'} {submitStatus.message}
              </div>
            )}

            <div className="terms-notice">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">
                I agree to the 
                <span className="terms-link" onClick={()=>setShowTerms(true)}>
                  Terms & Conditions
                </span>
                and confirm that the uploaded screenshot is genuine
              </label>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting || !selectedPlan}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="button-icon">🚀</span>
                  Complete Pre-Registration
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {showTerms && (
        <div className="terms-modal-overlay" onClick={()=>setShowTerms(false)}>
          <div className="terms-modal" onClick={e=>e.stopPropagation()}>

          <h3>VRPLAY – Terms & Conditions</h3>

          <div className="terms-content">

            <p><b>1.</b> Free activation offer is applicable only for Play Store pre-registered users.</p>

            <p><b>2.</b> User must upload genuine Play Store pre-registration screenshot.</p>

            <p><b>3.</b> Offer valid for limited time and may be withdrawn without notice.</p>

            <p><b>4.</b> Only one free activation per mobile number.</p>

            <p><b>5.</b> OTT availability depends on selected entertainment pack.</p>

            <p><b>6.</b> VRPLAY reserves the right to approve or reject any registration.</p>

            <p><b>7.</b> Plans, OTT platforms and pricing are subject to change.</p>

            <p><b>8.</b> User data will be used only for activation & communication purposes.</p>

            <p><b>9.</b> Screenshot verification is mandatory to claim the offer.</p>

            <p><b>10.</b> By submitting this form, you agree to be contacted by VRPLAY team.</p>

          </div>

          <button className="close-terms" onClick={()=>setShowTerms(false)}>
            Close
          </button>

          </div>
        </div>
        )}

    </div>
  );
}
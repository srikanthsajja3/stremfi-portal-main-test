import React, { useEffect, useRef, useContext, useState } from "react";
import { UserContext } from "../UserContext";
import apiClient from "../../api/client";
import { ASSET_BASE_URL } from "../../config/env";
import { FaTimes, FaQrcode, FaWallet, FaRupeeSign } from "react-icons/fa";
import "./index.css";

const QRCodeModal = ({ onClose, upiId = "your-upi@bank" }) => {
  const { user } = useContext(UserContext);
  const modalRef = useRef(null);
  const [amount, setAmount] = useState("");
  const rechargeAmount = Number(amount);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.keyCode === 27) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Handle copy UPI ID
  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId)
      .then(() => {
        // You could add a toast notification here
        alert("UPI ID copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy UPI ID: ", err);
      });
  };

  const handleOnlinePayment = async () => {

    if (!rechargeAmount) {
      alert("Please enter amount");
      return;
    }

    if (rechargeAmount < 500) {
      alert("Minimum wallet top-up amount is ₹500");
      return;
    }

    try {

      const { data } = await apiClient.post(
        "/payments/create_payment.php",
        { amount: amount }
      );

      if(data.status){
        window.location.href = data.payment_url;
      }
      else{
        alert(data.message || "Payment failed");
      }

    } catch(error){
      console.error(error);
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div 
        className="qr-modal" 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-labelledby="qr-modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="qr-modal-header">
          <div className="qr-title">
            <FaWallet className="title-icon" aria-hidden="true" />
            <h2 id="qr-modal-title">Wallet</h2>
          </div>
          <button 
            className="qr-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        {/* Payment Methods */}
        <div className="payment-methods">


          {(user?.createdBy === 1 || user?.createdBy === "1") ? (

            // PaymentSetu wallet top-up
            <div className="online-payment-box">

              <h3 className="section-title">
                <FaRupeeSign 
                  className="section-icon"
                />
                Wallet Top-up
              </h3>

              <input
                type="number"
                min="500"
                placeholder="Minimum ₹500"
                value={amount}
                onChange={(e)=>setAmount(e.target.value)}
                className="amount-input"
              />

              {/* <div className="quick-amounts">

                {[500,1000,2000,5000].map(value => (

                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className="amount-chip"
                  >
                    ₹{value}
                  </button>

                ))}

              </div> */}

              <button
                className="pay-now-btn"
                onClick={handleOnlinePayment}
              >
                Pay Now
              </button>

              <p className="info-text">
                Wallet will update automatically after payment success.
              </p>

            </div>

          ) : (

            // Existing QR payment for other operators
            <>

              <div className="qr-code-continer">

                {(user?.ottplayOperCode === 17297) ? (
                  <>
                  <h3 className="section-title">
                    <FaQrcode 
                      className="section-icon"
                    />
                    Scan & Pay
                  </h3>
                  <img
                    src={`${ASSET_BASE_URL}/masterqr.jpg`}
                    alt="UPI QR"
                    className="qr-code-image"
                  />
                  <p className="instruction-text">
                    Use any UPI app to scan the QR code & send money
                  </p>
                  <div className="additional-info">
                    <p className="info-text simple-pulse">
                      After payment, please share the receipt with admin.
                    </p>
                  </div>
                  </>
                ) : (
                  <p>Please Contact your Admin</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
import React from "react";
import "./index.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          For any issues or queries, you may contact:
        </p>

        <div className="footer-contact">
          <p>
            📧 Mail:{" "}
            <a href="mailto:support@stremfi.in">
              support@stremfi.in
            </a>
          </p>

          <p>📞 Contact: 9703388253 | 9125253535</p>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} StremFi. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
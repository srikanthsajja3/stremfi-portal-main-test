import React, { useEffect } from "react";

// DigiLocker's redirect_url target. Loads inside the popup window that
// was opened for verification — DigiLocker gives us NO data on return,
// so this page's only real job is to close the popup. The PARENT tab
// (the actual form) never navigates and detects completion itself via
// polling, so this page isn't load-bearing for correctness — it's just
// a courtesy so the popup doesn't sit there confusing the user.
const DigilockerPopupClose = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.close();
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
      <p>Verification complete.</p>
      <p>This window will close automatically…</p>
    </div>
  );
};

export default DigilockerPopupClose;
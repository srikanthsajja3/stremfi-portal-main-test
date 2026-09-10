import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from "./component/UserContext";

const FormHeader = ({}) => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const role = user.role;

  const handelDashboradShift = () => {
    if (role === "superadmin") {
      navigate("/superadmin");
    } else if (role === "admin") {
      navigate("/admin");
    } else if (role === "operator") {
      navigate("/operator")
    } else {
      logout();
    }
  }

  return ( 
    <header className="header-stremfi">
      <div className="header-content form-header-content">
        <img src="/stremfi-logo.png" alt="StremFi" className="logo" onClick={() => handelDashboradShift()} />
        <Link to={-1} className="back-link">
            ← Back
        </Link>
      </div>
    </header>
  );
};

export default FormHeader;

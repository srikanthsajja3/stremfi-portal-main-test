import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from "../UserContext";
import { FaTachometerAlt, FaUsers, FaUserTie, FaUserFriends, FaSignOutAlt, FaBars, FaEye, FaKey } from 'react-icons/fa';
import { RiAdminLine } from "react-icons/ri";
import { AiOutlineUserSwitch } from "react-icons/ai";
import { BiSolidUserVoice } from "react-icons/bi";
import './index.css';
import { Nav } from 'react-bootstrap';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, token, logout, rootToken, backLogin } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  const role = user.role;
  const operatorName = user.operatorName;
  const operatorId = user.operatorId;
  const createdBy = user.createdBy;
  const internetEnabled = user.internetEnabled;

  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // First clear the context
    logout();
    
    // Close menus
    setMenuOpen(false);
    setDropdownOpen(false);
    
    // Small delay to ensure context is cleared before redirect
    setTimeout(() => {
      navigate("/login", { replace: true });
      
      // Fallback: if still not on login page after 100ms, force redirect
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 100);
    }, 0);
  };

  const handelDashboradShift = () => {
    if (role === "superadmin") {
      navigate("/superadmin", { replace: true });
    } else if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "operator") {
      navigate("/operator", { replace: true })
    } else {
      logout();
    }
  }

  // Check if a nav link is active
  const isActiveLink = (path) => {
    // Exact match for dashboard links
    if (path === '/superadmin' || path === '/admin' || path === '/operator') {
      return location.pathname === path;
    }
    
    // For other links, check if current path starts with the link path
    return location.pathname.startsWith(path);
  };

  const handleBack = () => {
    backLogin();

    // decode role directly from rootToken
    if (rootToken) {
      const decoded = JSON.parse(atob(rootToken.split(".")[1]));
      const role = decoded.user?.role;

      if (role === "superadmin") navigate("/superadmin", { replace: true });
      else if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "operator") navigate("/operator", { replace: true });
    }
  };

  return (
    <header className="header-stremfi">
      <div className="header-container">
        <div className="header-left">
          <img src="/stremfi-logo.png" alt="StremFi" className="logo" onClick={() => handelDashboradShift()} />
        </div>
        
        <div className="header-right">
          <div ref={menuRef} className="hamburger-btn-ref" >
            <button 
              className="hamburger-btn" 
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <FaBars />
            </button>
            
            <nav className={`nav-menu ${menuOpen ? 'active' : ''}`}>
              {role === 'superadmin' && (
                <>
                  <NavLink to="/superadmin" icon={<FaTachometerAlt />} text="Dashboard" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/superadmin')} />
                  <NavLink to="/admins" icon={<FaUserTie />} text="Admins" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/admins')} />
                  <NavLink to="/operators" icon={<FaUsers />} text="Operators" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/operators')} />
                  <NavLink to="/internet-customers" icon={<FaUserFriends />} text="Customers" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/internet-customers')} />
                  {/* Activity Log and RailWire Session moved to dashboard
                      cards on the superadmin home page instead of nav links —
                      see SuperAdminHome/index.js */}
                </>
              )}
              {role === 'admin' && (
                <>
                  <NavLink to="/admin" icon={<FaTachometerAlt />} text="Dashboard" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/admin')} />
                  <NavLink to="/admins" icon={<FaUserTie />} text="Admins" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/admins')} />
                  <NavLink to="/operators" icon={<FaUsers />} text="Operators" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/operators')} />
                  <NavLink to="/internet-customers" icon={<FaUserFriends />} text="Customers" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/internet-customers')} />
                </>
              )}
              {role === 'operator' && (
                <>
                  <NavLink to="/operator" icon={<FaTachometerAlt />} text="Dashboard" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/operator')} />
                  <NavLink to="/internet-customers" icon={<FaUserFriends />} text="Customers" onClick={() => setMenuOpen(false)} isActive={isActiveLink('/internet-customers')} />
                </>
              )}
            </nav>
          </div>

          {token && rootToken && token !== rootToken && (
            <button 
              className="profile-btn"
              onClick={() => handleBack()}
              aria-label="Profile switch"
            >
              <AiOutlineUserSwitch className="profile-icon"/>
            </button>
          )}
          
          <div className="profile-wrapper" ref={dropdownRef}>
            <button 
              className="profile-btn" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Profile menu"
            >
              <RiAdminLine className="profile-icon" />
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <FaEye className="icon info-icon" />
                  <span>{operatorName} <span className="role-badge">{role}</span></span>
                </div>
                <button className="dropdown-item" onClick={() => navigate("/change-password")}>
                  <FaKey className="icon primary-icon" />
                  <span>Change Password</span>
                </button>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <FaSignOutAlt className="icon danger-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const NavLink = ({ to, icon, text, onClick, isActive }) => (
  <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`} onClick={onClick}>
    <span className="nav-icon">{icon}</span>
    <span className="nav-text">{text}</span>
  </Link>
);

const NavDropdown = ({ icon, text, isActive, children }) => {
  const [open, setOpen] = useState(false);

  // Closing on outside click would need a ref + document listener;
  // simplest reliable option given this also has to work on mobile
  // (where hover isn't a thing) is just collapsing again once any
  // child link is clicked — each child's own onClick already does
  // that via setMenuOpen(false), so this just also needs to close
  // itself the same way. Wrapping the children's onClick isn't
  // necessary since the whole nav-menu collapsing on mobile already
  // hides this along with everything else.
  return (
    <div className={`nav-dropdown ${isActive ? 'active' : ''}`}>
      <button
        type="button"
        className={`nav-link nav-dropdown-toggle ${isActive ? 'active' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="nav-icon">{icon}</span>
        <span className="nav-text">{text}</span>
        <span className="nav-dropdown-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="nav-dropdown-menu">
          {children}
        </div>
      )}
    </div>
  );
};

export default Header;
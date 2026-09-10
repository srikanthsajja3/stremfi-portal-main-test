import { useState, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { UserContext } from "../UserContext";
import { jwtDecode } from "jwt-decode";
import apiClient from "../../api/client";
import './index.css';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showSubmitError, setShowSubmitError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, login } = useContext(UserContext); // ⬅️ use context
  const navigate = useNavigate();

  const onChangeUsername = (event) => {
    setUsername(event.target.value);
    setShowSubmitError(false);
  };

  const onChangePassword = (event) => {
    setPassword(event.target.value);
    setShowSubmitError(false);
  };

  const onSubmitSuccess = (data) => {
    // Store token in context
    login(data.token);

    // Role comes from decoded token in context
    const decoded = jwtDecode(data.token);
    const role = decoded.user?.role || data.role; // fallback to API role

    if (decoded.user?.mustChangePassword) {
      // Forced password change (new account, or a superadmin-triggered
      // reset) takes priority over the normal role redirect — checked
      // again server-side on every request too (verify_token.php), this
      // is just so there's no flash of the real dashboard first.
      navigate('/change-password');
      return;
    }

    if (role === 'superadmin') {
      navigate('/superadmin');
    } else if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'operator') {
      navigate('/operator');
    } else {
      navigate('/login');
    }
  };

  const onSubmitFailure = (errorMsg) => {
    setShowSubmitError(true);
    setErrorMsg(errorMsg);
    setIsLoading(false);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!username || !password) {
      onSubmitFailure('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const userDetails = { loginUsername: username, loginPassword: password };
      const { data } = await apiClient.post('/login.php', userDetails);

      if (data.token) {
        onSubmitSuccess(data);
      } else {
        onSubmitFailure(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      onSubmitFailure(error.response?.data?.message || 'Network error. Please check your connection.');
    }
  };

  // 🔹 If already logged in, redirect based on role
  if (user) {
    if (user.role === "superadmin") return <Navigate to="/superadmin" />;
    if (user.role === "admin") return <Navigate to="/admin" />;
    if (user.role === "operator") return <Navigate to="/operator" />;
  }

  return (
    <div className="login-form-container">
      <div className="login-card">
        <div className="logo-container">
            <img
              src="/stremfi-logo.png"
              className="login-logo"
              alt="StremFi logo"
            />
        </div>

        <form className="login-form" onSubmit={submitForm}>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Please login to your account</p>

          <div className="form-group">
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                className="username-input-field"
                value={username}
                onChange={onChangeUsername}
                placeholder=" "
              />
              <label htmlFor="username" className="input-label">Username</label>
              <div className="input-underline"></div>
            </div>

            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                className="password-input-field"
                value={password}
                onChange={onChangePassword}
                placeholder=" "
              />
              <label htmlFor="password" className="input-label">Password</label>
              <div className="input-underline"></div>
            </div>
          </div>

          <button 
            type="submit" 
            className={`login-button`}
            disabled={isLoading}
          >
            {isLoading ? (
                <>
                  Authenticating...
                </>
              ) : (
                <>
                  Login
                </>
              )}
          </button>

          {showSubmitError && (
            <div className="login-error-message">
              <svg className="error-icon" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 
                        10 10 10-4.48 10-10S17.52 2 
                        12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg> 
              {errorMsg}
            </div>
          )}

          <div className="log-footer">
            {/* <p className="powered-by">Powered by SD Technologies</p> */}
          </div>
        </form>
      </div>
      
    </div>
  );
};

export default LoginForm;

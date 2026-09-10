import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from './UserContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useContext(UserContext);

  // ✅ wait until restoration is complete
  if (loading) {
    return <p>Loading...</p>; // or a spinner
  }

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "superadmin") {
      return <Navigate to="/superadmin" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (user.role === "operator") {
      return <Navigate to="/operator" replace />;
    } else {
      return <Navigate to="/not-found" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { account } = useAuth();
  const location = useLocation();

  if (!account) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(account.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

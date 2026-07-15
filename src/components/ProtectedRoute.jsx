import { Navigate, useLocation } from "react-router-dom";
import { getStoredAccount } from "../utils/cartStorage";

export default function ProtectedRoute({ children, allowedRoles }) {
  const account = getStoredAccount();
  const location = useLocation();

  if (!account) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(account.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

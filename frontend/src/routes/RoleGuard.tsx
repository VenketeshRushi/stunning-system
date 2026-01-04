import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@/stores/auth.store";

interface RoleGuardProps {
  allowedRoles: Array<"user" | "admin" | "superadmin">;
  children: React.ReactNode;
  fallbackPath?: string;
}

const RoleGuard = ({
  allowedRoles,
  children,
  fallbackPath = "/dashboard",
}: RoleGuardProps) => {
  const user = useUser();
  const location = useLocation();

  // Not authenticated
  if (!user) {
    return <Navigate to='/login' replace state={{ from: location.pathname }} />;
  }

  // Authenticated but not authorized
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;

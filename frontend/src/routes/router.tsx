import { lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import PublicRoute from "@/routes/PublicRoute";
import PrivateRoute from "@/routes/PrivateRoute";
import RoleGuard from "@/routes/RoleGuard";
import PublicLayout from "@/layouts/PublicLayout";
import PrivateLayout from "@/layouts/PrivateLayout";
import NotFound from "@/pages/NotFound";

const Login = lazy(() => import("@/pages/Login"));
const OAuthCallback = lazy(() => import("@/pages/OAuthCallback"));
const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Faq = lazy(() => import("@/pages/Faq"));

const Onboarding = lazy(() => import("@/pages/Onboarding"));

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const UserAccount = lazy(() => import("@/pages/UserAccount"));
const ChatLayout = lazy(() => import("@/pages/chat/ChatLayout"));

const AdminDashboard = lazy(
  () => import("@/pages/admin/AdminDashboard/AdminDashboard")
);
const AdminUsersManagement = lazy(
  () => import("@/pages/admin/UserManagement/UserManagement")
);

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      {
        element: <PublicRoute />,
        children: [
          {
            element: <PublicLayout />,
            children: [
              { index: true, element: <Home /> },
              { path: "login", element: <Login /> },
              { path: "auth/callback", element: <OAuthCallback /> },
              { path: "about", element: <About /> },
              { path: "contact", element: <Contact /> },
              { path: "faq", element: <Faq /> },
            ],
          },
        ],
      },
      {
        element: <PrivateRoute />,
        children: [
          {
            element: <PrivateLayout />,
            children: [
              { path: "dashboard", element: <Dashboard /> },
              { path: "account", element: <UserAccount /> },
              { path: "chat", element: <ChatLayout /> },
              { path: "onboarding", element: <Onboarding /> },

              {
                path: "admin",
                element: (
                  <RoleGuard allowedRoles={["admin", "superadmin"]}>
                    <Outlet />
                  </RoleGuard>
                ),
                children: [
                  { index: true, element: <Navigate to='dashboard' replace /> },
                  { path: "dashboard", element: <AdminDashboard /> },
                  { path: "users", element: <AdminUsersManagement /> },
                ],
              },
            ],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

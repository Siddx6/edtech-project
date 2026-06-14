import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user || !user.role) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
import React from "react";
import "./Badge.css";

function Badge({ children, variant = "default", className = "", ...props }) {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Badge;

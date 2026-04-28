import React from "react";
import "./Button.css";

function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? "btn-full-width" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;

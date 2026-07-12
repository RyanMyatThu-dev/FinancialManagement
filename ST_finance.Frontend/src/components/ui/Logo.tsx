import React from "react";

interface LogoProps {
  className?: string;
  showGlow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8 w-8", showGlow = true }) => {
  return (
    <img
      src="/logo.png"
      alt="ST-Finance Logo"
      className={`${className} object-contain ${showGlow ? "neon-pulse" : ""}`}
    />
  );
};

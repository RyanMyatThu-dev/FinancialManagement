import React from "react";

interface LogoProps {
  className?: string;
  showGlow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8 w-8", showGlow = true }) => {
  return (
    <svg
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible`}
    >
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        className={showGlow ? "dark:[filter:url(#neon-glow)] transition-all duration-200" : ""}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 76.0 107.4 L 76.0 116.3 L 78.0 116.3 L 83.9 111.4 L 114.6 108.4 L 157.2 98.5 L 205.7 80.7 L 230.4 68.8 L 246.3 58.9 L 253.2 58.9 L 295.8 81.7 L 342.3 98.5 L 384.9 108.4 L 415.6 111.4 L 421.5 117.3 L 422.5 107.4" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 364.1 156.9 L 361.1 159.9 L 316.6 166.8 L 312.6 169.8 L 295.8 165.8" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 242.3 226.2 L 243.3 218.3 L 238.4 216.3 L 234.4 208.4 L 227.5 201.5 L 219.6 197.5 L 203.7 196.5 L 196.8 197.5 L 188.9 201.5 L 184.9 205.4 L 180.9 217.3 L 183.9 227.2 L 188.9 232.2 L 224.5 247.0 L 238.4 254.9 L 247.3 256.9 L 249.2 252.9 L 315.6 187.6 L 316.6 181.7 L 312.6 170.8" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 359.1 227.2 L 354.2 209.4 L 340.3 205.4 L 333.4 207.4 L 316.6 225.2 L 315.6 338.1" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 76.0 228.2 L 76.0 117.3" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 293.8 239.1 L 286.9 260.9 L 277.0 263.8 L 266.1 274.7 L 261.1 276.7 L 256.2 274.7 L 247.3 257.9" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 422.5 240.1 L 422.5 231.2 L 416.6 235.1 L 412.6 266.8 L 405.7 292.6 L 397.8 313.3 L 383.9 339.1 L 366.1 362.8 L 339.3 389.6 L 311.6 410.4 L 273.0 432.1 L 253.2 440.1 L 246.3 440.1 L 205.7 421.2 L 178.0 403.4 L 146.3 376.7 L 124.5 351.9 L 109.7 329.2 L 91.8 288.6 L 83.9 251.0 L 81.9 223.2 L 78.0 219.3" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 168.1 279.7 L 167.1 284.6 L 160.2 286.6 L 142.3 304.4 L 136.4 306.4 L 130.4 303.4 L 125.5 292.6 L 116.6 263.8 L 111.6 229.2 L 111.6 140.1 L 149.3 132.2 L 191.8 119.3 L 249.2 93.6 L 294.8 114.3 L 325.5 125.2 L 363.1 135.1 L 386.9 139.1 L 386.9 233.2 L 382.9 261.9 L 369.0 303.4 L 355.2 328.2 L 340.3 347.0 L 317.6 368.8 L 298.8 382.6 L 273.0 398.5 L 252.2 407.4 L 243.3 406.4 L 214.6 391.6 L 175.0 362.8 L 154.2 341.1 L 152.2 335.1 L 154.2 329.2 L 157.2 326.2 L 164.1 324.2 L 183.9 336.1 L 196.8 340.1 L 222.5 340.1 L 235.4 336.1 L 246.3 329.2 L 255.2 318.3 L 260.1 302.4 L 260.1 277.7" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 287.9 339.1 L 287.9 261.9" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 246.3 447.0 L 253.2 447.0" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 249.2 50.0 L 249.2 57.9" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 422.5 118.3 L 422.5 230.2" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 361.1 160.9 L 361.1 174.7 L 355.2 209.4" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 200.7 169.8 L 215.6 169.8 L 229.4 172.8 L 241.3 178.7 L 253.2 189.6 L 258.2 196.5 L 259.1 205.4 L 249.2 217.3 L 244.3 218.3" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 192.8 170.8 L 199.8 170.8" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 188.9 171.8 L 191.8 171.8" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 179.9 175.7 L 173.0 179.7 L 164.1 188.6 L 157.2 200.5 L 154.2 214.3 L 157.2 234.1 L 163.1 244.0 L 177.0 255.9 L 226.5 277.7 L 232.4 285.6 L 233.4 299.5 L 229.4 308.4 L 222.5 312.4 L 200.7 313.3 L 186.9 307.4 L 177.0 296.5 L 172.0 286.6 L 168.1 284.6" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
        <path d="M 250.2 441.1 L 250.2 446.0" className="text-zinc-900 dark:text-[hsl(var(--primary))] transition-colors duration-200" />
      </g>
    </svg>
  );
};

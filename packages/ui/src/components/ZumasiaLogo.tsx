type LogoProps = {
  size?: number;
  variant?: 'full' | 'mark';
};

export function ZumasiaLogo({ size = 34, variant = 'full' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Zumasia"
      >
        <defs>
          <linearGradient id="zumasia-mark-gradient" x1="6" y1="9" x2="41" y2="37" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5ED4FF" />
            <stop offset="1" stopColor="#2788E8" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="24" r="15" stroke="url(#zumasia-mark-gradient)" strokeWidth="5.5" />
        <path
          d="M29 33.5L40.5 40L34 28.5"
          stroke="url(#zumasia-mark-gradient)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="24" r="8" stroke="#214B93" strokeWidth="4.5" />
        <circle cx="20" cy="24" r="3.8" fill="#214B93" />
      </svg>
    );
  }

  const width = Math.round(size * 4.8);

  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 220 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zumasia"
    >
      <defs>
        <linearGradient id="zumasia-full-gradient" x1="8" y1="12" x2="43" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ED4FF" />
          <stop offset="1" stopColor="#2788E8" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="15" stroke="url(#zumasia-full-gradient)" strokeWidth="5.5" />
      <path
        d="M33 33.5L44.5 40L38 28.5"
        stroke="url(#zumasia-full-gradient)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="8" stroke="#214B93" strokeWidth="4.5" />
      <circle cx="24" cy="24" r="3.8" fill="#214B93" />
      <text
        x="56"
        y="31"
        fill="#F7FBFF"
        fontFamily="'Segoe UI', 'Trebuchet MS', sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="-0.03em"
      >
        zumasia
      </text>
    </svg>
  );
}

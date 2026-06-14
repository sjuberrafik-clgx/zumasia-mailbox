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
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Zumasia"
      >
        <defs>
          <linearGradient id="zm-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#080C13" />
            <stop offset="1" stopColor="#141C2B" />
          </linearGradient>
          <linearGradient id="zm-top" x1="16" y1="20" x2="48" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="zm-bot" x1="16" y1="44" x2="48" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0EA5E9" />
            <stop offset="1" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id="zm-diag" x1="48" y1="20" x2="16" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#zm-bg)" />
        <rect x="0.5" y="0.5" width="63" height="63" rx="15.5" stroke="rgba(255,255,255,0.08)" />
        <g opacity="0.3">
          <path d="M 16 20 H 48" stroke="#000000" strokeWidth="10" strokeLinecap="round" transform="translate(0, 3)" />
          <path d="M 16 44 H 48" stroke="#000000" strokeWidth="10" strokeLinecap="round" transform="translate(0, 3)" />
        </g>
        <path d="M 16 20 H 48" stroke="url(#zm-top)" strokeWidth="10" strokeLinecap="round" />
        <path d="M 16 44 H 48" stroke="url(#zm-bot)" strokeWidth="10" strokeLinecap="round" />
        <path d="M 16 44 L 48 20" stroke="#000000" strokeWidth="10" strokeLinecap="round" opacity="0.4" transform="translate(-2, 2)" />
        <path d="M 16 44 L 48 20" stroke="url(#zm-diag)" strokeWidth="10" strokeLinecap="round" />
      </svg>
    );
  }

  const width = Math.round(size * 3.75);

  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 240 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zumasia"
    >
      <defs>
        <linearGradient id="zm-bg-f" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#080C13" />
          <stop offset="1" stopColor="#141C2B" />
        </linearGradient>
        <linearGradient id="zm-top-f" x1="16" y1="20" x2="48" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="zm-bot-f" x1="16" y1="44" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="zm-diag-f" x1="48" y1="20" x2="16" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#zm-bg-f)" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="15.5" stroke="rgba(255,255,255,0.08)" />
      <g opacity="0.3">
        <path d="M 16 20 H 48" stroke="#000000" strokeWidth="10" strokeLinecap="round" transform="translate(0, 3)" />
        <path d="M 16 44 H 48" stroke="#000000" strokeWidth="10" strokeLinecap="round" transform="translate(0, 3)" />
      </g>
      <path d="M 16 20 H 48" stroke="url(#zm-top-f)" strokeWidth="10" strokeLinecap="round" />
      <path d="M 16 44 H 48" stroke="url(#zm-bot-f)" strokeWidth="10" strokeLinecap="round" />
      <path d="M 16 44 L 48 20" stroke="#000000" strokeWidth="10" strokeLinecap="round" opacity="0.4" transform="translate(-2, 2)" />
      <path d="M 16 44 L 48 20" stroke="url(#zm-diag-f)" strokeWidth="10" strokeLinecap="round" />
      <text
        x="78"
        y="44"
        fill="#F7FBFF"
        fontFamily="'Segoe UI', 'Trebuchet MS', sans-serif"
        fontSize="34"
        fontWeight="800"
        letterSpacing="-0.04em"
      >
        zumasia
      </text>
    </svg>
  );
}

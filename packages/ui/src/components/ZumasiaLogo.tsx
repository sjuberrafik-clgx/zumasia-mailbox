type LogoProps = {
  size?: number;
};

export function ZumasiaLogo({ size = 28 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zumasia"
    >
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#10b981" />
      <path
        d="M9 11.5h14L9 20.5h14"
        stroke="#0b0d10"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

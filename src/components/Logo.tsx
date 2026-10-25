/** A shield with a check — blue for the "trusted" flow, amber for the "consent" flow, like the design. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="logo-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fd3ff" />
          <stop offset="1" stopColor="#1f6fe0" />
        </linearGradient>
      </defs>
      <path className="logo__shield" d="M20 4.5 32 9v9.5c0 7.6-5 13.3-12 16-7-2.7-12-8.4-12-16V9z" fill="rgba(61,155,255,0.12)" stroke="url(#logo-shield)" strokeWidth="2.2" />
      <path className="logo__check" d="m14.5 20 4 4 7.5-8" fill="none" stroke="#ff9a3d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

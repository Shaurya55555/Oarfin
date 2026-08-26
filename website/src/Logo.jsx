// Custom shield-and-signal mark, replacing the generic Font Awesome
// fa-shield-halved icon that was standing in as the brand logo everywhere
// (navbar, hero, footer, auth modal). A shield outline with a broadcasting
// pulse arc and center dot reads as "alert signal" rather than a generic
// security shield, closer to what an emergency-alert platform's mark
// should communicate. Uses currentColor + the svg's own `color` style so
// CSS custom properties (e.g. var(--color-primary)) always resolve
// correctly, unlike passing them as raw SVG presentation attributes.
export default function OarfinLogo({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color, flexShrink: 0 }} aria-hidden="true">
      <path
        d="M16 2.5 L27 6.5 V15 C27 21.8 22.4 27.6 16 29.5 C9.6 27.6 5 21.8 5 15 V6.5 Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 17.5 C10.5 14 13 11.5 16 11.5 C19 11.5 21.5 14 21.5 17.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M13 17.5 C13 15.6 14.3 14.3 16 14.3 C17.7 14.3 19 15.6 19 17.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <circle cx="16" cy="20.2" r="1.8" fill="currentColor" />
    </svg>
  );
}

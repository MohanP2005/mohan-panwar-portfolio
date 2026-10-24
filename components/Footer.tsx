import { site } from "@/content/site";

export default function Footer() {
  return (
    <footer className="footer">
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        <defs>
          <filter id="footer-outline" x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="grown" />
            <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
            <feFlood floodColor="#14161c" floodOpacity="0.35" result="ink" />
            <feComposite in="ink" in2="ring" operator="in" />
          </filter>
        </defs>
      </svg>
      <div className="footer-name" aria-hidden="true">MOHAN</div>
      <div className="footer-row">
        <span>© {site.year}</span>
        <span>{site.location}</span>
      </div>
    </footer>
  );
}
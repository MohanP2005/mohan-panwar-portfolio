import { site } from "@/content/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-name" aria-hidden="true">MOHAN</div>
      <div className="footer-row">
        <span>© {site.year}</span>
        <span>{site.location}</span>
      </div>
    </footer>
  );
}
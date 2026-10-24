export const BASE_PATH = "/mohan-panwar-portfolio";
export const BLOG_URL = "#";   // set to Substack/Medium/etc when decided
export const RESUME_PATH = `${BASE_PATH}/resume.pdf`;

export const site = {
  email: "mohanpanwar2005@gmail.com",
  statusLine: "[Your status line]",
  year: 2026,
  location: "NEW YORK",
  github: { label: "GitHub", handle: "@MohanP2005", href: "https://github.com/MohanP2005" },
  linkedin: { label: "LinkedIn", handle: "/in/mohan-panwar", href: "https://www.linkedin.com/in/mohan-panwar-633a3b338/" },
  // Twitter/X: set href to "" to hide this row.
  twitter: { label: "Twitter", handle: "@MoPanwar2005", href: "https://x.com/MoPanwar2005" },
  facts: [
    { label: "(01) CURRENTLY", value: "Building tablebid, live auctions for NYC reservations" },
    { label: "(02) INTO", value: "Trading systems, game bots, data" },
    { label: "(03) BASED IN", value: "New York" },
  ],
  contactHeadline: "Have an idea? I’m all ears.",
  contactCopy: "[One line on what you want to hear about.] Click Email and pick a reason, and I’ll start the message for you.",
};

export type Project = { name: string; year: string; desc: string; tags: string[]; url: string };
export const projects: Project[] = [
  { name: "tablebid", year: "2026", desc: "Live auctions for hard-to-get NYC restaurant reservations.", tags: ["Next.js","Postgres","Stripe"], url: "https://tablebid-gold.vercel.app" },
  { name: "gamios", year: "2026", desc: "A card game engine with a bot I play against, plus a strategy report.", tags: ["Python","Game AI"], url: "" /* private, no public link yet */ },
  { name: "Loan approval redesign", year: "2026", desc: "Reworking how a small-dollar loan portfolio decides who gets approved.", tags: ["Python","Data analysis"], url: "https://github.com/MohanP2005/small-dollar-loan-approval-redesign" },
  { name: "trade-hub", year: "2026", desc: "One command that runs a trading strategy as a backtest, on paper, or live.", tags: ["Python","Trading"], url: "" /* private, no public link yet */ },
];

export type Reason = { label: string; subject: string; body: string };
export const reasons: Reason[] = [
  { label: "Job opportunity", subject: "Job opportunity at [company]", body: "Hi Mohan,\nI’m at [company] and saw your work on [project]. We have a role you might like…" },
  { label: "Collaboration", subject: "Want to build something together?", body: "Hi Mohan,\nI’m working on [idea] and think we could build it together…" },
  { label: "tablebid for my restaurant", subject: "tablebid for [restaurant name]", body: "Hi Mohan,\nI run [restaurant] in [neighborhood]. Our tables book out fast and I’d like to hear about a pilot…" },
  { label: "Just saying hi", subject: "Hey!", body: "Hi Mohan,\nFound your site and wanted to say…" },
];
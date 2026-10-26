import type { AboutPhoto } from "@/lib/slideshow";

export const BASE_PATH = "/mohan-panwar-portfolio";
export const SITE_URL = "https://mohanp2005.github.io/mohan-panwar-portfolio";
export const FIRST_POST_DATE = "2026-11-01";
export const RESUME_PATH = `${BASE_PATH}/resume.pdf`;

export const site = {
  email: "mohanpanwar2005@gmail.com",
  statusLine: "Building Tablebid",
  year: 2026,
  location: "NEW YORK",
  github: { label: "GitHub", handle: "@MohanP2005", href: "https://github.com/MohanP2005" },
  linkedin: { label: "LinkedIn", handle: "/in/mohan-panwar", href: "https://www.linkedin.com/in/mohan-panwar-633a3b338/" },
  // Twitter/X: set href to "" to hide this row.
  twitter: { label: "Twitter", handle: "@MoPanwar2005", href: "https://x.com/MoPanwar2005" },
  facts: [
    { label: "(01) CURRENTLY", value: "Building Tablebid, live auctions for NYC reservations" },
    { label: "(02) INTO", value: "Trading systems, game bots, data" },
    { label: "(03) BASED IN", value: "Bay Area → New York" }, // TODO(mohan): confirm
  ],
  contactHeadline: "Have an idea? I’m all ears.",
  contactCopy: "If you’re hiring, building something, or run a restaurant with a waitlist, I’d love to hear from you.",
};

// About-section photo slideshow. Hidden while this array is empty.
// Drop media in public/about/. Image entries need src/alt/caption; video entries add kind: "video"
// and an optional poster (shown while loading and under prefers-reduced-motion).
export const aboutPhotos: AboutPhoto[] = [
  {
    kind: "video",
    src: `${BASE_PATH}/about/pickup.mp4`,
    poster: `${BASE_PATH}/about/pickup.jpg`,
    alt: "Mohan taking a shot during a pickup basketball game",
    caption: "Pickup on a Sunday.",
  },
  {
    src: `${BASE_PATH}/about/pokemon.jpg`,
    alt: "Several Ditto Pokémon cards in sleeves on top of a box of sleeved bulk cards",
    caption: "Every Ditto I own. The box under them is why I'm building the app.",
  },
  {
    kind: "video",
    src: `${BASE_PATH}/about/zipline.mp4`,
    poster: `${BASE_PATH}/about/zipline.jpg`,
    alt: "Someone hanging upside down from a zipline in a forest in Cancún",
    caption: "Hanging upside down on a zipline in Cancún.",
  },
  {
    src: `${BASE_PATH}/about/event.jpg`,
    alt: "A packed room at a TrueMarkets event during NYC Tech Week 2026",
    caption: "TrueMarkets at NYC Tech Week 2026.",
  },
];

export type AboutPart = string | { text: string; project: string };
export const about: AboutPart[][] = [
  ["I’m Mohan, a senior studying Data Science at Rutgers, based in New York. I learn best by building, and most of what I make starts as something I wanted to exist and couldn’t find."],
  ["I care about shipping things people actually use and writing down what I learn along the way."],
  ["Off the keyboard, I play pickup basketball, collect Pokémon cards, and travel whenever I can."],
];

export type Project = { name: string; year: string; desc: string; tags: string[]; url: string };
export const projects: Project[] = [
  { name: "Tablebid", year: "2026", desc: "Live auctions for hard-to-get NYC restaurant reservations.", tags: ["Next.js","Postgres","Stripe"], url: "https://tablebid-gold.vercel.app" },
  { name: "Gamios", year: "2026", desc: "A card game engine with a bot I play against, plus a strategy report.", tags: ["Python","Game AI"], url: "" /* private, no public link yet */ },
  { name: "Loan Pricing PRD", year: "2026", desc: "PM case study: from 2.2M Lending Club loans to a PRD on how income is priced into risk.", tags: ["Product","SQL","Data analysis"], url: "https://github.com/MohanP2005/small-dollar-loan-approval-redesign" },
  { name: "Trade Hub", year: "2026", desc: "One command that runs a trading strategy as a backtest, on paper, or live.", tags: ["Python","Trading"], url: "" /* private, no public link yet */ },
];

export type Reason = { label: string; subject: string; body: string };
export const reasons: Reason[] = [
  { label: "Job opportunity", subject: "Job opportunity at [company]", body: "Hi Mohan,\nI’m at [company] and saw your work on [project]. We have a role you might like…" },
  { label: "Collaboration", subject: "Want to build something together?", body: "Hi Mohan,\nI’m working on [idea] and think we could build it together…" },
  { label: "Tablebid for my restaurant", subject: "Tablebid for [restaurant name]", body: "Hi Mohan,\nI run [restaurant] in [neighborhood]. Our tables book out fast and I’d like to hear about a pilot…" },
  { label: "Just saying hi", subject: "Hey!", body: "Hi Mohan,\nFound your site and wanted to say…" },
];
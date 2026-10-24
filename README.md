# Mohan Panwar, portfolio

Personal portfolio site: hero, selected work, writing, and a contact section that drafts an email for you. Next.js static export (`output: 'export'`) with Geist, deployed to GitHub Pages.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000/mohan-panwar-portfolio/ (the site is served under its Pages basePath, so the bare `localhost:3000/` will 404).

Other scripts:

- `npm run build` builds the static site into `out/`
- `npm run lint` and `npm run typecheck`
- `npm test` runs the unit tests (`tests/lib.test.mts`)
- `npm run test:e2e` runs the Copy-email browser check against a running dev server (`E2E_URL` overrides the URL). First time only: `npx playwright install chromium`

## Where to edit content

- `content/site.ts`: email, status line, social links, facts, contact copy, the project list, and the email reason chips. `BLOG_URL` (the "All posts" link) lives here too and is `#` until a blog exists. A link with an empty URL is not rendered (e.g. set Twitter/X `href` to `""` to hide it), and a project with an empty `url` shows `GOING LIVE SOON` instead of an Open project button.
- `content/posts.ts`: the writing section. `POSTS_ARE_EXAMPLES` is `true` while the posts are placeholders; set it to `false` once they are real. Each post links out via its `url`.
- `public/resume.pdf`: the resume, linked as `/mohan-panwar-portfolio/resume.pdf`.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `out/` to GitHub Pages. One-time setup: Settings, Pages, Source must be set to **GitHub Actions**.

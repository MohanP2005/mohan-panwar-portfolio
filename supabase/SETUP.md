# Turning on comments, likes and view counts

The site works without any of this. Until you finish these steps, the interactive bits are hidden. Takes about 20 minutes.

## 1. Create the free project
1. Go to https://supabase.com, sign in with GitHub, click **New project**.
2. Pick the free plan, any name (e.g. `mohan-site`), a region near you, and save the database password somewhere.
3. Wait about a minute for it to provision.

## 2. Paste the schema
1. In the project, open **SQL Editor** > **New query**.
2. Paste the whole of `supabase/schema.sql` and press **Run**. It is safe to run twice.
3. The admin email is hard-coded in `is_admin()` as `mohanpanwar2005@gmail.com`. Change it there if you sign in with a different email.

## 3. Copy the URL and anon key
In **Project Settings > API** copy the **Project URL** and the **anon public** key. Never use the `service_role` key.

**GitHub secrets (production build)**
1. Repo > **Settings > Secrets and variables > Actions > New repository secret**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. `.github/workflows/deploy.yml` already passes both into `npm run build`. The keys are baked into the static site at build time, so re-run the deploy after adding or changing them (Actions > Deploy to GitHub Pages > Run workflow).

**Local dev**
```
cp .env.example .env.local   # then fill in both values
npm run dev                  # http://localhost:3000/mohan-panwar-portfolio/
```

## 4. Redirect URLs
**Authentication > URL Configuration**
- **Site URL:** `https://mohanp2005.github.io/mohan-panwar-portfolio/`
- **Redirect URLs** (add all):
  - `http://localhost:3000/mohan-panwar-portfolio/**`
  - `https://mohanp2005.github.io/mohan-panwar-portfolio/**`

Sign-in sends people back to the exact post page they were on (trailing slash included).

## 5. GitHub sign-in
1. GitHub > **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Homepage URL: `https://mohanp2005.github.io/mohan-panwar-portfolio/`.
3. Authorization callback URL: `https://<your-project-ref>.supabase.co/auth/v1/callback` (the exact URL is shown in Supabase under **Authentication > Providers > GitHub**).
4. Create the app, generate a client secret, then paste Client ID and Secret into Supabase > **Authentication > Providers > GitHub** and enable it.

## 6. Google sign-in
1. https://console.cloud.google.com > create or pick a project.
2. **APIs & Services > OAuth consent screen**: User type External, fill in app name and your email, add scopes `email` and `profile` (the defaults), publish to production (otherwise only test users can sign in).
3. **APIs & Services > Credentials > Create credentials > OAuth client ID**, type **Web application**.
   - Authorized JavaScript origins: `https://mohanp2005.github.io` and `http://localhost:3000`
   - Authorized redirect URIs: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client secret into Supabase > **Authentication > Providers > Google** and enable it.

## 7. Check it works
Open a post, sign in, post a comment, reply, like, delete. As the admin email you can delete anyone's comment.

## Good to know
- **Free-tier pause:** a free project pauses after 7 days of no activity. Comments, likes and views then fail quietly (the UI shows "Comments are unavailable right now."). Open the Supabase dashboard and click **Restore** to wake it. Any traffic that hits the API counts as activity, but a quiet blog can still pause.
- **Likes are spam-able:** a like is tied to a random id in the visitor's browser, so anyone can inflate a count. Fine for v1.
- **View counts** count once per post per browser session.
- **Comments** have no rate limiting or moderation queue; you can soft-delete any comment while signed in as the admin, or edit rows in the Table Editor.

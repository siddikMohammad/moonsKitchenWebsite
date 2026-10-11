# Deployment process: Moon's Kitchen website

The folder is already linked to the Netlify site **moonskitchen**
(https://moonskitchen.netlify.app), so no setup is needed.

## Steps

1. Open a terminal in the website folder:

   ```bash
   cd "C:\Users\mohammad siddik\Documents\work on moonkitchen git\moonsKitchenWebsite"
   ```

2. (Optional) Test locally first. This costs no Netlify credits:

   ```bash
   netlify dev
   ```

3. Commit and push your changes to GitHub:

   ```bash
   git add -A
   git commit -m "describe your change"
   git push
   ```

4. Deploy to production:

   ```bash
   netlify deploy --prod --build
   ```

   When it finishes it prints the production URL.

## Rules

- **Never drag and drop the folder** into the Netlify website. That drops the
  Functions and breaks login and orders.
- **Always use `--build`.** It builds `dist/` and bundles the Netlify Functions.
- **Each production deploy uses credits.** The free plan is credit-based, so
  batch your changes into one deploy.
- **Passwords and keys live in the Netlify dashboard** (Site settings ->
  Environment variables), not in files. Examples: `SUPABASE_URL`,
  `SUPABASE_SECRET_KEY`, `ADMIN_EMAILS`.
- **Branches:** the live site is currently deployed from branch
  `orders_reviews`. If Netlify is later connected to GitHub, merge to `main`
  first, or Netlify will publish old code.

## Preview before going live (optional)

```bash
netlify deploy --build
```

Without `--prod` this gives a temporary preview link and does not change the
live site. It may still use some credits.

## If a deploy breaks the site

In the Netlify dashboard open **Deploys**, pick the last good deploy and choose
**Publish deploy** to roll back.

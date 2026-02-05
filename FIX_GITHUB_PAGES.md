# Fix GitHub Pages

The issue is that GitHub Pages needs the files at the repository root. Here's how to fix it:

## Option 1: Move files to root (Recommended)

Since your git repo is in "Mohan Panwar landing page link", the files ARE at the root. The issue might be:

1. **Check GitHub Pages Settings:**
   - Go to: https://github.com/MohanP2005/mohan-panwar-portfolio/settings/pages
   - Make sure:
     - Source is set to "Deploy from a branch"
     - Branch is set to "main"
     - Folder is set to "/ (root)"
   - Click Save

2. **Make sure repository is Public:**
   - Go to: https://github.com/MohanP2005/mohan-panwar-portfolio/settings
   - Scroll to "Danger Zone"
   - Make sure it's set to Public (not Private)

3. **Wait a few minutes:**
   - GitHub Pages can take 1-5 minutes to deploy
   - Check: https://github.com/MohanP2005/mohan-panwar-portfolio/actions
   - Look for "pages build and deployment" workflow

4. **Check the URL:**
   - Try: https://mohanp2005.github.io/mohan-panwar-portfolio/
   - Make sure there's no trailing slash issues

## Option 2: If still not working, verify file structure

Run these commands in the repo directory:

```bash
cd "/Users/mohanpanwar/Documents/Python Folder/Personal/Projects_for_resume/Mohan Panwar landing page link"
ls -la
```

You should see:
- index.html
- README.md
- .gitignore

If files are missing, add and commit them:

```bash
git add index.html README.md .gitignore
git commit -m "Add landing page files"
git push
```

## Troubleshooting

- **404 Error**: Repository might be private or Pages not enabled
- **Blank Page**: Check browser console for errors
- **Still building**: Wait 5-10 minutes and refresh


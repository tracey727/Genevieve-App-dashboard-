GENEVIEVE MOBILE TEST DASHBOARD
GitHub + Cloudflare ready

WHAT THIS PACKAGE DOES
- Gives you one simple phone screen.
- Shows Main Command Centre ONLINE/OFFLINE.
- Shows Health ONLINE/OFFLINE.
- Shows Animal ONLINE/OFFLINE.
- Lets you tap each service to change its test status.
- Saves the status on that phone.
- Includes Set all online and Set all offline buttons.
- Can be installed to the phone Home Screen after Vercel deployment.

IMPORTANT
This package starts in MANUAL TEST mode. A public Vercel website cannot directly read
services running only on localhost inside your laptop. Manual mode works immediately.

GITHUB
1. Create a new empty GitHub repository.
2. Upload every file from inside this folder to the repository root.
3. Do not upload the outer ZIP file into the repository.
4. Commit the files to the main branch.

CLOUDFLARE PAGES
1. Connect this GitHub repository to Cloudflare Pages.
2. Framework preset: none / static HTML.
3. Build command: leave empty.
4. Output directory: repository root.
5. Deploy.

PHONE
1. Open the Cloudflare Pages address on the phone.
2. In Safari, tap Share > Add to Home Screen.
3. Open the new Home Screen shortcut.
4. Tap a service card to change ONLINE/OFFLINE.

LIVE ENDPOINT MODE LATER
Open config.js and change:
  mode: "manual"
to:
  mode: "live"

Then place a public HTTPS health URL into healthUrl for each service.
The endpoints must be reachable from the internet and allow browser requests (CORS).
Do not use localhost or 127.0.0.1 in a public deployment.

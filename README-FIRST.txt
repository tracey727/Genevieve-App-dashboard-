GENEVIEVE MOBILE TEST DASHBOARD
GitHub + Vercel ready

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

VERCEL
1. In Vercel, choose Add New > Project.
2. Import the new GitHub repository.
3. Framework Preset: Other.
4. Root Directory: leave as the repository root.
5. Build Command: leave empty.
6. Output Directory: leave empty.
7. Click Deploy.

PHONE
1. Open the Vercel address on the phone.
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
Do not use localhost or 127.0.0.1 in a Vercel deployment.

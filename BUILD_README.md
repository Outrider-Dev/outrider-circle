# Outrider Circle — GitHub Actions Windows EXE builder

This repository is prepared to build a Windows EXE of the Electron app using **electron-builder** and GitHub Actions.

## How to use

1. Create a new GitHub repository (private or public).
2. Upload all files from this folder to the repository root.
3. Commit and push to the `main` branch.
4. On GitHub, go to **Actions** → choose the **Build Windows EXE** workflow and run it or push a commit to trigger it.
5. When the workflow finishes, download the built installer from the workflow **Artifacts** (artifact named `outrider-windows-exe`).

Notes:
- The workflow uses `electron-builder` on a Windows runner. It will produce an EXE and an installer (NSIS).
- If you need code signing, configure secrets in GitHub and update electron-builder config.

If you want, I can prepare the GitHub repo for you or give you step-by-step commands to push these files to a repo.

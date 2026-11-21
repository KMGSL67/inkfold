# Inkfold

Welcome! Inkfold is a free notes app for Windows, and this is where you download it.

You can write by hand with a pen, type, and open PDFs to write on them or fill them in. It costs nothing, needs no account, and works without an internet connection.

**[Download Inkfold for Windows][releases]** · [Visit the website][website]

## Install in three steps

1. **Download.** Open the [releases page][releases] and, under "Assets", click the file whose name ends in `-setup.exe`.
2. **Open the installer.** Windows shows a blue box first. Click **More info**, then **Run anyway** (see below for why). The installer needs no administrator password and installs Inkfold just for you.
3. **Start writing.** Open Inkfold. A short welcome lets you try the pen and name your first notebook. There is nothing to sign up for.

Inkfold is made for Windows 11. It also runs on up-to-date Windows 10.

### About the blue Windows box

The first time you open the installer, Windows SmartScreen shows a box that says "Windows protected your PC". It does not mean something is wrong with the file. It appears because the installer is not "code-signed", which is a paid stamp that tells Windows who made a program. That stamp costs money every year, and Inkfold is free, so it does not have one.

SmartScreen is a sensible check, and it is right to stop and read it. If you downloaded the installer from this repository's [releases page][releases], choose **More info**, then **Run anyway**.

If the file came from anywhere else, do not run it. Delete it and download it again from the releases page.

If you like to be sure, every release also lists a checksum (a fingerprint of the installer file). The release notes explain how to compare it in one line.

## What's in it

Everything in this list is built and in the download.

**Pens and ink**

- Six kinds of pen: fineliner, fountain pen, pencil, marker, brush pen and highlighter, plus an eraser
- A pen tray that keeps your pens, each with its own colour and thickness. Hold a pen and drag it to change the order.
- Many colours, each with a name, plus colours you mix yourself
- Pressure sensitivity: press harder for a heavier line
- Undo and redo

**Selecting and shapes**

- A lasso: circle what you wrote, then move it, resize it, recolour it, copy it or delete it
- Shapes: line, arrow, rectangle, ellipse and triangle. Hold Shift for straight lines, squares and circles.
- A text tool, for when typing is quicker than writing

**Paper and pages**

- Eleven kinds of paper: lined, lined with a margin, squared, dotted, isometric dots, music staves, handwriting lines, Cornell notes, a to-do list, a week and a storyboard
- Your own page sizes, from 5 to 200 cm on each side
- An endless canvas instead of pages, if you prefer: choose it when you make a notebook, and it grows as you write
- A Pages panel to see every page and to add, insert, duplicate, rotate, reorder or delete pages, or export a single page
- Zoom and pan, with a page that never moves by accident

**PDFs**

- Open a PDF and write on it or highlight it
- Fill in worksheets: with the Text tool, click an empty line or box in a PDF and type right there. This works best on typed PDFs. On scanned pages it can guess wrong; a right-click removes a wrong guess, and you can switch it off for scans in Settings.
- Rotate, reorder, duplicate or delete the pages of a PDF, and add blank pages to it
- Export your notes or a finished PDF as a new PDF. The file you opened is never changed.

**Staying organised**

- A library for your notebooks and PDFs, with folders inside folders and a folder list at the side
- 16 colours and 40 icons for folders, and notebook covers in six styles, with an icon if you like
- Tabs, so several notebooks and PDFs can be open at once
- Recently deleted: things you delete wait there for 30 days before they go

**Keeping your work safe**

- Autosave and crash protection. If the app or the PC stops suddenly, Inkfold brings your work back the next time it starts and tells you so in a calm note.
- Earlier versions of every notebook, so you can go back
- A backup of everything once a day, plus a "Back up now" button and restore

**Look and language**

- A calm look built around folded paper, like the corner in the Inkfold logo
- Light mode and a deep blue-black dark mode
- English and German
- The window opens where you left it, at the size you left it

A pen and a mouse are both welcome. With a pen, the pen draws and a finger moves the page. Without one, the mouse and keyboard do everything. Inkfold works with active pens that Windows recognises as a pen.

This is version 0.1, the first one. It has been tested, but expect a few rough edges, and please [tell us][issues] when you find one.

## Coming later

These are planned and **not built yet**. No dates are promised.

- Pictures on the page
- Headings, checklists and tables
- A ruler
- Two documents side by side
- Handwriting search, and handwriting turned into text
- Text recognition (OCR)
- PDF forms and signing
- Merging and splitting PDFs
- Planners and stickers

## Privacy

- **No internet.** Inkfold itself never goes online. There is no telemetry (no usage data is collected), no crash reporting and no update check. Windows' WebView2 component, which displays the app, may contact Microsoft on its own, as it does for other Windows apps. WebView2 can also keep crash reports on your PC, which Windows may send to Microsoft depending on your diagnostic-data settings, but Inkfold itself sends nothing.
- **No account.** There is no sign-in and nothing to register.
- **No tracking.** No ads and no analytics, in the app or on the website.
- **Your notes stay on your PC.** Nothing is uploaded anywhere by Inkfold.

Two honest footnotes:

- Because Inkfold never goes online, it cannot tell you about new versions. Look at the [releases page][releases] now and then.
- On Windows 11, installing needs no internet. On a PC that does not have WebView2 yet (some Windows 10 PCs), the installer downloads it from Microsoft during setup. That is the only time, and it is the installer, not the app.

## Where your notes live, and how backups work

**Your notes** are kept in Inkfold's own data folder on your PC:

```
%LOCALAPPDATA%\app.inkfold.desktop
```

(To look inside, paste that line into the address bar of File Explorer and press Enter.) You never need to open this folder. The files in it are named with codes rather than your notebook names, so the library inside Inkfold is the place to find, rename and move things.

**Backups** are the files to care about:

- Once a day, Inkfold saves a backup of your whole library into `Documents\Inkfold Backups`. Each backup is one zip file, named like `Inkfold auto backup 2026-11-20 14-32.zip`.
- The newest 7 automatic backups are kept; older automatic ones are tidied away.
- **Back up now** (Settings → Backups → Backup and restore…) makes a backup straight away, whenever you like. Inkfold never deletes backups you made yourself.
- **Restore** never deletes what you have now. If a notebook is both in the backup and in your library, the one from the backup is added as a copy.
- You can choose another backup folder (a USB stick, for example), or switch daily backups off, in the same window.

If your Documents folder is synced by OneDrive or another service that you set up, your backups are synced with it. That is your sync service at work; Inkfold itself still never goes online.

To move to a new PC: copy your newest backup file over, install Inkfold there, and restore it.

Uninstalling Inkfold uses the usual Windows way (Settings → Apps). Your backups in Documents stay where they are.

## Price

Free for everyone, for private use and for commercial use. There are no ads, no paid tier and nothing to unlock later.

## Thank you to

Inkfold is built with free software and free fonts made by other people. Their licences ask that they be named, and they deserve it:

| Part | What it does in Inkfold | Licence |
|---|---|---|
| [Tauri](https://github.com/tauri-apps/tauri) and its plugins | The Windows app window and file access | MIT or Apache-2.0 |
| [React](https://github.com/facebook/react) | The buttons, menus and screens | MIT |
| [Zustand](https://github.com/pmndrs/zustand) | Remembers what is open and selected | MIT |
| [perfect-freehand](https://github.com/steveruizok/perfect-freehand) | Turns pen movement into smooth ink | MIT |
| [PDF.js](https://github.com/mozilla/pdf.js) | Shows PDF pages | Apache-2.0 |
| [pdf-lib](https://github.com/Hopding/pdf-lib) and [fontkit](https://github.com/Hopding/fontkit) | Write the exported PDF | MIT |
| [fflate](https://github.com/101arrowz/fflate) | Packs each notebook into one file | MIT |
| [Lucide](https://github.com/lucide-icons/lucide) | Icons | ISC (some icons MIT, from Feather) |
| [Inter](https://github.com/rsms/inter) | The font for typed text in notebooks | SIL Open Font License 1.1 |
| [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) | The font for headings, in the app and on the website | SIL Open Font License 1.1 |
| The Rust libraries ("crates") inside the Windows program, and the Rust standard library | The small part of Inkfold that talks to Windows | MIT, Apache-2.0, BSD-3-Clause, Unicode-3.0 and similar permissive licences |
| MinGW-w64 runtime | Small helper code that every program built this way contains | Permissive licences of the MinGW-w64 project |
| WebView2Loader (Microsoft Edge WebView2 SDK) | Starts the Windows component that displays the app | BSD-style licence, © Microsoft Corporation |

This table is a summary. The complete list, with every copyright notice and the full licence texts, comes with the app: open **Settings → About Inkfold…**, or open the file `THIRD-PARTY-NOTICES.txt` that the installer puts next to the program. Inkfold is an independent project and is not connected to or endorsed by any of the projects or companies named on this page.

## Report a problem

If something does not work, please [open an issue][issues]. It helps to say what you did, what you expected, what happened instead, and which version of Windows you use. Leave out anything private, because issues are public.

## About this repository

This repository holds the Inkfold downloads (under [Releases][releases]) and the website (in `docs/`). The app's source code is not in this repository. Inkfold is free to use, but it is not open source.

<!-- ═══════════════════════════════════════════════════════════════════════
     THE ONE PLACE IN THIS FILE WHERE THE ADDRESSES LIVE.
     They are filled in. If the repository is ever renamed or moved,
     change the three lines below.
     Every link in this README is built from these three lines.
     ═══════════════════════════════════════════════════════════════════════ -->
[releases]: https://github.com/KMGSL67/inkfold/releases/latest
[issues]: https://github.com/KMGSL67/inkfold/issues
[website]: https://kmgsl67.github.io/inkfold/

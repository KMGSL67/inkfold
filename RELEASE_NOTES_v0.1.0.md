# Inkfold 0.1.0

The first public version of Inkfold: a free Windows app for handwritten notes, typed text and PDFs. No account, no ads, no internet needed.

## Download and install

1. Under **Assets** below, click the file ending in `-setup.exe`.
2. Open it. Windows shows a blue box that says "Windows protected your PC". Click **More info**, then **Run anyway**. The box appears because the installer is not code-signed; signing costs money every year and Inkfold is free. Only do this for a file you downloaded from this page.
3. Open Inkfold and start writing.

Made for Windows 11; also runs on up-to-date Windows 10.

## What's in this version

- **Pens:** six kinds (fineliner, fountain pen, pencil, marker, brush pen, highlighter) and an eraser, in a tray that keeps each pen's colour and thickness. Hold a pen and drag it to change the order. Many named colours and your own mixes, pressure sensitivity, undo and redo.
- **Lasso:** circle what you wrote, then move it, resize it, recolour it, copy it or delete it
- **Shapes:** line, arrow, rectangle, ellipse and triangle. Hold Shift for straight lines, squares and circles.
- **Text:** a text tool for typed notes
- **Paper:** eleven kinds (lined, lined with a margin, squared, dotted, isometric dots, music staves, handwriting lines, Cornell notes, to-do list, week, storyboard), your own page sizes from 5 to 200 cm, or an endless canvas instead of pages
- **Pages:** a Pages panel to add, insert, duplicate, rotate, reorder and delete pages, or export a single page. It works on PDFs too.
- **PDFs:** open a PDF, write on it, and export a finished copy. The original file is never changed.
- **Fill in worksheets:** with the Text tool, click an empty line or box in a PDF and type right there
- **Library:** notebooks and PDFs in folders, with 16 colours and 40 icons for folders, notebook covers in six styles, and tabs for several open documents
- **Safety:** autosave, crash protection that brings your work back after a sudden stop, earlier versions of every notebook, and a backup of everything once a day into `Documents\Inkfold Backups` (the newest 7 automatic backups are kept)
- **Look and language:** a calm folded-paper look, light mode and a deep blue-black dark mode, English and German

## Good to know

- This is a first version. Expect a few rough edges.
- Finding blanks works best on typed PDFs. On scanned or photographed pages it sometimes marks the wrong spot. A right-click on a wrong mark removes it, and Settings has a switch for scans.
- Pages or endless canvas is chosen when you make a notebook. It cannot be switched afterwards in this version.
- Inkfold never goes online, so it cannot tell you about new versions. Check this page now and then.
- Inkfold itself makes no internet connections. Windows' WebView2 component, which displays the app, may contact Microsoft on its own, as it does for other Windows apps. On a PC that does not have WebView2 yet (some Windows 10 PCs), the installer downloads it from Microsoft during setup.
- If your Documents folder is synced by OneDrive or another service you set up, your backups are synced with it. That is your sync service, not Inkfold.
- The licence notices of everything Inkfold is built with are in the app (Settings → About Inkfold…) and in `THIRD-PARTY-NOTICES.txt` next to the program.

## Not in this version yet

Pictures on the page, headings and checklists and tables, a ruler, two documents side by side, handwriting search and text recognition, PDF forms and signing, merging and splitting PDFs. They are planned; no dates are promised.

## Check your download (optional)

A checksum is a fingerprint of a file. If the fingerprint of your download matches the one below, you have exactly the file that was published here.

Under **Assets** there is a small text file whose name ends in `.sha256.txt`. It holds the same line as this one:

```
9301cfc1b4bcfc7126ff13f12b6537f7c22d142bb1fb6ec8a5fd5674b2a63c19  Inkfold_0.1.0_x64-setup.exe
```

To check, open the folder with the installer, click into the address bar of File Explorer, type `powershell` and press Enter. Then type:

```
Get-FileHash .\Inkfold_0.1.0_x64-setup.exe -Algorithm SHA256
```

The long code under "Hash" must be the same as the one above (capital and small letters do not matter). If it is different, delete the file and download it again from this page.

## Found a problem?

Please open an issue in this repository (the **Issues** tab at the top). Say what you did, what you expected and what happened. Leave out anything private, because issues are public.

Happy writing.

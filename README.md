# Image Delivery Checker

A private, offline tool for checking a batch of images before delivering them to a client. Built with plain HTML, CSS and JavaScript. No installation, server, build step, account, API, online font or runtime library is required.

## Open the app

1. Extract the entire ZIP. On Windows, right-click it and choose **Extract All**.
2. Open the extracted `image-delivery-checker` folder. Keep its files and subfolders together.
3. Double-click **index.html** and open it in a modern desktop browser. Chrome is the fully tested browser for this release.
4. Select **Try sample images**.

**Success sign:** six thumbnails appear. With the original **Square social post** example selected, the summary reads **2 passed** and **4 need attention**. This works with the internet disconnected and the address starting with `file:///`.

Do not open `index.html` inside the ZIP preview. Extract it first.

## Check your images

1. Choose a **Preset**, or select **New specification** to create a copy of the current requirements.
2. Edit its name, dimension rule, width, height, allowed formats and maximum file size. These examples are editable client specifications, **not official platform requirements**.
3. Drag multiple files into the dashed area, or select **Browse files** and choose several JPG, PNG or WebP images. `.jpeg` is supported too.
4. Wait for checking to finish. Each row shows a thumbnail, filename, dimensions, detected format, file size and result. A failed image lists every applicable reason.
5. Use **Passed** or **Needs attention** to filter the list. Change a requirement to recheck all loaded images immediately.
6. Select **Export CSV** to download the complete report.

**Success sign:** when you change the maximum size from `2` to `4` MB in the square example, `texture-large.png` changes from Needs attention to Passed, giving **3 passes**.

- New files are appended; existing rows are preserved. Selecting the same file twice creates two rows.
- **×** removes a result. **Clear all** clears the list. Neither action edits or deletes the original files.
- **Reset to example** restores only the currently selected built-in example. It does not reset the other examples or remove custom specifications.
- Edited and custom specifications remain available while this page is open, including when switching presets. **Reloading or closing the page clears images and specification edits.** There is no persistent storage. Export your report first.

## Example specifications

| Example | Dimension rule | Allowed formats | Maximum size |
| --- | --- | --- | --- |
| Square social post | Exactly 1080 × 1080 px | JPG, PNG | 2 MB |
| Product image | At least 1600 × 1600 px | JPG, PNG, WebP | 5 MB |
| Website banner | Exactly 1920 × 640 px | JPG, PNG, WebP | 2 MB |

**Exactly** requires both dimensions to match. **At least** checks the two axes independently: 1700 × 1600 passes a 1600 × 1600 minimum, while 1600 × 1599 fails. A minimum does not require an exactly square aspect ratio.

## How checks work

- **Dimensions:** the browser decodes the image and reports its displayed pixel dimensions. JPEG EXIF rotation is applied by the tested browser; a stored 640 × 1920 JPEG rotated 90° is checked as 1920 × 640.
- **Format:** JPG/JPEG, PNG and WebP are identified from their file signatures, then actually decoded. A filename or supplied MIME type alone is not trusted. A PNG renamed to `.jpg` is reported and checked as PNG. Filename extension conventions are not a separate requirement in this version.
- **File size:** the original file's exact byte count is compared with an inclusive limit. **1 MB = 1,000,000 bytes**, and 1 KB = 1,000 bytes. A file exactly at the limit passes; one byte over fails. Display sizes are rounded; hover over a size on desktop or use the CSV for the exact byte count.
- **Invalid files:** zero-byte files, unknown data, unsupported formats and files the browser cannot decode are retained as failures with a reason. Their unavailable dimensions show as a dash and are blank in CSV.
- **Invalid specifications:** empty names, invalid dimensions, no selected formats or invalid size limits pause result evaluation and disable export. Correct the highlighted fields to continue. Paused checks are not reported as passes.

Dimensions must be whole numbers from 1 to 100,000. File limits must be above zero and at most 50 MB, written as plain numbers with up to six decimal places, for example `0.035793`. Specification names allow 1–80 characters.

## Real sample files

The six original geometric images in `samples/` are real JPG, PNG and WebP files. They are decoded through the same code path as your own files; the app does not hard-code their results. The noise PNG contains over 3.5 MB of actual pixel data, not filler appended to a small image.

| File | Actual dimensions | Actual bytes | Original square example result |
| --- | --- | ---: | --- |
| `social-square.jpg` | 1080 × 1080 | 35,793 | PASS |
| `studio-square.png` | 1080 × 1080 | 8,370 | PASS |
| `small-square.jpg` | 800 × 800 | 17,770 | FAIL: dimensions |
| `website-banner.webp` | 1920 × 640 | 9,818 | FAIL: dimensions and disallowed WebP |
| `texture-large.png` | 1080 × 1080 | 3,504,560 | FAIL: over 2 MB |
| `product-detail.jpg` | 1600 × 1600 | 60,367 | FAIL: dimensions |

With the original **Product image** example, only `product-detail.jpg` passes. With the original **Website banner** example, only `website-banner.webp` passes.

`samples/sample-data.js` contains byte-for-byte embedded copies of these files for the sample button. A local script works under `file://` without fetching files or starting a server. `samples/manifest.json` records the actual dimensions, formats and byte counts. The real image files are also included so you can drag them into the tool yourself.

### Try invalid files

1. Select the square example and **Reset to example**, then **Clear all**.
2. Open `samples/invalid/` in your file manager.
3. Select its six files and drag them into the dashed area.

**Success sign:** all six need attention:

| File | Expected reason |
| --- | --- |
| `not-an-image.jpg` | Plain text masquerading as JPG; unrecognized image data |
| `empty.png` | Zero-byte, empty file |
| `damaged.jpg` | JPG signature, but no decodable image |
| `damaged.png` | PNG signature, but damaged image data |
| `damaged.webp` | WebP signature, but damaged image data |
| `unsupported.gif` | Actual GIF, unsupported by this tool |

These deliberately invalid fixtures are not included when using **Try sample images**. If selecting invalid files through the file picker, you may need to choose its **All files** option.

## Export the CSV report

1. Wait until no rows say **Checking…**, and correct any specification errors.
2. Select **Export CSV**.
3. Open `image-delivery-report.csv` from your browser's Downloads folder in Excel, Numbers or another spreadsheet application.

**Success sign:** the six built-in sample files produce one header and six data records, including two PASS records and four FAIL records for the original square example.

The report always includes **all files**, even when a filter hides some rows. It contains filenames, decoded dimensions, actual format, exact bytes, decimal MB, PASS/FAIL, all reasons, the specification name and requirements, and a UTC report timestamp. It describes the currently selected specification at export time.

CSV uses UTF-8 with a BOM, CRLF record separators and quoted cells. Commas, quotes, newlines and Unicode names are escaped. Formula-like names are prefixed with an apostrophe for spreadsheet safety. This version exports CSV; it does not import reports or save custom presets in them for reloading.

## Privacy and limits

- All image reading, thumbnail rendering, checks and CSV creation happen on your device. The app makes no network requests and has no analytics or external resources. Its Content Security Policy blocks network connections.
- Original files are read only. Thumbnail generation is for display and does not change the originals. There are no image resizing, conversion, AI or automatic repair features.
- The workspace holds up to **200 files**. If a batch exceeds that capacity, the app tells you how many were added and how to add the rest.
- Files larger than **50 MB** are reported as not decoded. Two files are processed at a time; decoding times out after 15 seconds per file. Very large compressed images can still consume substantial memory when decoded.
- This is a delivery-specification checker, not a forensic file validator. Browsers can tolerate some malformed or truncated image data; a successfully decoded image is not proof that every byte or metadata field is valid. It does not check color profile, print DPI, transparency, embedded metadata, visual quality or animation frames.
- Exported CSV files contain filenames and specifications. Share them only with the intended recipient.
- The layout adapts to mobile screens. Opening a local HTML application on a phone depends on its browser and file manager; some phone file previews do not run JavaScript. Desktop viewport tests do not establish support for every mobile file manager.

## Project files

| File or folder | Purpose |
| --- | --- |
| `index.html` | Start here; page structure, accessible controls and Content Security Policy |
| `styles.css` | Responsive layout, controls and result styles |
| `core.js` | Format detection, specification validation, comparisons and CSV serialization |
| `app.js` | File reading/decoding, thumbnail lifecycle, drag-and-drop and interactions |
| `assets/icon.svg` | Local app icon |
| `samples/` | Six real sample images, embedded copies and metadata |
| `samples/invalid/` | Six intentionally invalid or unsupported test files |
| `tests/core.test.cjs` | Optional automated logic and sample-integrity tests |
| `tests/delivery-smoke.cjs` | Optional offline browser delivery checks; requires separately available Playwright and Chrome |
| `tests/verify-package.py` | Optional ZIP integrity and source-preservation checks; Python standard library only |
| `TEST_EVIDENCE.md` | Actual test commands, evidence links and untested scope |
| `evidence/` | Recorded test logs, browser screenshots and actual sample/invalid CSV downloads |
| `README.md` | Instructions, verification and limitations |

No runtime dependencies are bundled or required. Developers who already have Node.js can open a terminal in this folder and run:

```text
node --test tests/core.test.cjs
```

**Success sign:** 16 tests pass, with zero failures. Node.js is only needed for these optional developer tests, not to use the app.

## Version 1 test results

Verified on **2026-11-06**, on Windows with **Chrome 156.0.8078.80**, using Playwright 1.62.1 and direct `file://` navigation with the browser network set offline. The in-app browser connection timed out during setup, so testing used a separate local headless Chrome session with no access to a signed-in browser profile.

**16 automated logic tests and 24 browser verification groups passed.** The logic tests also verified that the embedded samples exactly match the real image files.

Final delivery adds documentation and QA evidence only; the application, design and sample files are unchanged. The 16 logic tests were rerun, and a separate 7-group offline delivery check passed against the source folder and the final ZIP's extracted copy. The earlier 24-group regression log is retained as historical evidence; that full suite was not rerun during finalization. See [TEST_EVIDENCE.md](TEST_EVIDENCE.md) for the actual commands, logs, screenshots and package-verification method.

| Browser checks | Result |
| --- | --- |
| Correct URL/title, meaningful initial page, no error overlay, export initially disabled | PASS |
| Six real samples, decoded thumbnails, expected pass/fail reasons | PASS |
| Actual CSV download with all files while a filter is active | PASS |
| All three presets, live edits, custom specification and preset draft retention | PASS |
| Invalid specification pauses checks and export; correction restores results | PASS |
| Text disguised as JPG, empty PNG, broken JPG/PNG/WebP and real GIF | PASS |
| PNG named `.jpg` detected as PNG; original MIME/extension not trusted | PASS |
| Exact byte boundary, one byte over, one pixel short, both minimum axes | PASS |
| JPEG EXIF rotation and the 50 MB processing guard | PASS |
| Drag-and-drop using real File/DataTransfer objects; drop outside prevents navigation | PASS |
| 30 real images in one batch; removal, reselection, clear during decoding | PASS |
| 200-file capacity with an explicit overflow message | PASS |
| HTML-like filenames rendered as text; CSV formulas, quotes, Unicode and newlines | PASS |
| Keyboard opens the multiple-file picker; reload resets session state | PASS |
| Widths 320, 390, 768, 1024 and 1536 px: no horizontal page overflow | PASS |
| Desktop and mobile screenshots visually inspected | PASS |
| App console warnings, runtime errors and external HTTP requests | 0 observed |

The desktop view was compared with the design reference at a 1536 × 1024 viewport. The header, two-column layout, blue/white palette, controls, type hierarchy and thumbnail rows were reviewed. Real byte counts, full failure explanations and session/MB notes intentionally add content beyond the design mockup. The mobile layout stacks the specification and image list and reformats each result into a readable row.

**Not tested:** Safari, Firefox, Microsoft Edge, physical phones/tablets, assistive-technology sessions, OS-level mouse dragging, unusual color profiles, every possible corrupt or animated file, and forced decoder timeout on slow hardware. Drag-and-drop was exercised through browser File/DataTransfer events; mobile checks used viewport emulation. This is not a claim of universal browser or file-format conformance.

## Quick manual checks

1. **Size boundary:** clear the list, load `social-square.jpg`, and use the original square requirements. Set the maximum to `0.035793` MB, then `0.035792` MB. **Success:** PASS at the first value and FAIL at the second.
2. **Minimum dimensions:** load `product-detail.jpg` and select the Product image example. Increase the required width to `1601`. **Success:** it changes from PASS to FAIL.
3. **Invalid settings:** clear the Width field or deselect every format. **Success:** results say Check paused and export is disabled; repairing the settings restores checks.
4. **Filtered export:** load the six samples, filter to Passed and export. **Success:** the CSV still has all six image records.
5. **Offline:** disconnect from the internet, reopen the extracted `index.html`, and try the samples. **Success:** all thumbnails and results still appear.

## Troubleshooting

- **No styling or buttons do nothing:** extract the whole ZIP and keep the folder structure intact. Enable JavaScript. A file preview pane may not run the app; open it in a browser.
- **Samples fail to load:** keep `samples/sample-data.js` in its original location. You can also browse for the actual images in `samples/`.
- **CSV does not appear:** check the browser's Downloads list and its download settings.
- **Edits disappeared after reopening:** this is expected. The app deliberately keeps images and custom specifications only in the current page session.
- **An image passes despite a different filename extension:** formats are determined from actual bytes. Rename files separately if your client also has a filename convention.

Version 1.0.0. Final local delivery package; no AgentGit upload or hosting.

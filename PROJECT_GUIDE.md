# Image Delivery Checker — Comprehensive Project Guide

**Application version:** 1.0.0  
**Document date:** November 7, 2026  
**Scope:** Documentation of the delivered application, its implementation, evidence and publication. This guide adds no application features and does not replace or rebuild the verified release ZIP.

## Contents

1. [Project overview](#project-overview)
2. [Start and use the application](#start-and-use-the-application)
3. [Delivery specifications](#delivery-specifications)
4. [Validation rules and result states](#validation-rules-and-result-states)
5. [Samples and expected outcomes](#samples-and-expected-outcomes)
6. [CSV report contract](#csv-report-contract)
7. [Implementation and file organization](#implementation-and-file-organization)
8. [Privacy, accessibility and responsive behavior](#privacy-accessibility-and-responsive-behavior)
9. [Test evidence and reproducibility](#test-evidence-and-reproducibility)
10. [Known limits and troubleshooting](#known-limits-and-troubleshooting)
11. [Release integrity and AgentGit publication](#release-integrity-and-agentgit-publication)
12. [Maintenance and handoff](#maintenance-and-handoff)

## Project overview

Image Delivery Checker helps social media managers, designers and other content producers check a batch of images against a client's delivery specification. It replaces repetitive manual inspection of dimensions, formats and file sizes with a single local workspace and an exportable report.

The application is built with plain HTML, CSS and JavaScript. Open `index.html` directly after extracting the project. No account, backend, server, build process, package installation, external API or internet connection is required to use it. Images remain on the user's device.

### Delivered capabilities

| Capability | Delivered behavior |
| --- | --- |
| Batch input | Drag files into the drop area or select multiple files through Browse files |
| Supported image types | JPG/JPEG, PNG and WebP, determined from actual file signatures and browser decoding |
| Image inventory | Thumbnail, filename, decoded dimensions, detected format and original file size |
| Specifications | Three editable examples and custom specifications derived from current requirements |
| Results | Clear pass/fail outcomes, with every applicable failure reason retained |
| Filters | All images, Passed and Needs attention |
| Reporting | CSV download containing all files and the requirements used to assess them |
| Demonstration | Six genuine sample images and six separately supplied invalid/unsupported fixtures |
| Layout | Desktop workbench and responsive mobile result rows |
| Privacy | Browser-local processing, no application network requests or persistent storage |

### Deliberately excluded

There is no resizing or format-conversion feature, automatic correction, AI integration, cloud upload, account system, CSV import, persistent preset library, or advanced image-quality analysis. A pass means the implemented delivery requirements were met; it does not assess the aesthetic quality or suitability of the image content.

## Start and use the application

### First launch

1. Download the verified release ZIP from the project's AgentGit shared files; the pinned release link appears in the release section below.
2. Extract the entire archive. On Windows, right-click the ZIP and select **Extract All**.
3. Open the extracted `image-delivery-checker` directory and double-click `index.html`.
4. Use a modern desktop browser. Chrome is the browser actually tested for this release.
5. Select **Try sample images** with the original **Square social post** example selected.

**Success sign:** six thumbnails appear, with **2 passed** and **4 need attention**. The address can start with `file:///`, and the same flow works without an internet connection. Opening the HTML inside a ZIP preview or a file preview pane may not run the application correctly.

### Check a client delivery

1. Choose a preset and edit its requirements, or select **New specification** to create a custom copy.
2. Give the specification a meaningful name, such as `Client A — square launch images`.
3. Choose **Exactly** or **At least**; enter width and height; select accepted formats; set a maximum file size.
4. Drag the delivery files into the dashed area, or select **Browse files** and choose several files together.
5. Wait for rows marked **Checking…** to finish. Inspect failures and use filters to focus on affected images.
6. Correct the original files in your own editing software if needed. This checker does not edit them.
7. Remove outdated rows and add the corrected images, then export the final report.

**Success sign:** every accepted image shows Passed, and any remaining failure explains which requirement was not met. Export is available after processing finishes and the specification is valid.

### Session behavior

- New files append to the existing list. Selecting the same file again creates another row; there is no deduplication.
- **×** removes one result. **Clear all** clears the list. These actions do not delete or alter original files.
- Switching specifications rechecks the already decoded images. Each specification retains its edits within the current page session.
- **Reset to example** restores the currently selected built-in example only. It does not reset every preset or delete custom specifications.
- **New specification** copies the current valid requirements; if they are invalid, it starts from the square example. The new name is immediately editable.
- Reloading or closing the page clears images and specification edits. Export before leaving if you need a record. A CSV is a report, not a restorable application session.

## Delivery specifications

These presets are illustrative client specifications, **not official requirements of a social network, marketplace or website platform**.

| Built-in example | Dimension rule | Accepted formats | Inclusive size limit |
| --- | --- | --- | --- |
| Square social post | Exactly 1080 × 1080 px | JPG, PNG | 2 MB |
| Product image | At least 1600 × 1600 px | JPG, PNG, WebP | 5 MB |
| Website banner | Exactly 1920 × 640 px | JPG, PNG, WebP | 2 MB |

### Field constraints

| Field | Accepted input |
| --- | --- |
| Name | Nonblank after trimming; implementation checks a maximum string length of 80 |
| Dimension rule | Exactly or At least |
| Width and height | Positive whole-number digit strings, 1–100,000 px per axis |
| Allowed formats | At least one of JPG, PNG or WebP |
| Maximum file size | Above 0 and up to 50 MB; plain decimal notation, up to six fractional digits |

Enter values such as `1080`, `2` or `0.035793`, without units, separators or exponential notation. Use a leading zero for a fractional size, for example `0.5`.

**Exactly** requires both axes to match. **At least** tests both axes independently and does not impose an aspect ratio: 1700 × 1600 passes a 1600 × 1600 minimum, but 1600 × 1599 fails.

## Validation rules and result states

### Processing sequence

```text
Selected or dropped files
  → queue entries containing original names and byte counts
  → empty-file check and signature detection
  → supported-format and 50 MB processing checks
  → browser image decode
  → displayed dimensions and small preview thumbnail
  → comparison with the selected valid specification
  → visible results and optional CSV download
```

Two files are processed concurrently. The workspace accepts at most 200 files. If an incoming batch exceeds the remaining capacity, the app explains how many files were added; the rest must be added after clearing space.

### Format and decoding

The decoder reads the first 16 bytes for format detection. JPEG, PNG and WebP signatures are supported. Recognized GIF, PDF and BMP data is reported as unsupported; unknown data receives an unrecognized-image message. Filename extensions and supplied MIME types are not sufficient to pass a file.

A PNG renamed to `.jpg` is checked as PNG. Extension consistency and client filename conventions are not separate requirements in this version.

Supported data is loaded into the browser's image decoder using a temporary object URL and a MIME type derived from its signature. Failed decoding is reported as invalid or damaged data. The decode wait has a 15-second timeout. Files larger than 50,000,000 bytes are not decoded, independently of the selected delivery specification.

### Dimensions

The app uses the decoded image's `naturalWidth` and `naturalHeight`. These describe the displayed dimensions reported by the browser. The recorded Chrome test confirmed JPEG EXIF rotation: a stored 640 × 1920 image with a 90-degree orientation was checked as 1920 × 640.

Preview thumbnails are generated for display only, with a maximum side of 144 pixels. This internal preview operation does not resize, replace or export the original image.

### File size

The checker compares the original file's integer byte count, not the preview size:

- 1 MB = 1,000,000 bytes; 1 KB = 1,000 bytes.
- The maximum is inclusive: a file exactly at the limit passes.
- One byte over the maximum fails.
- Decimal MB input is converted to integer bytes from its whole and fractional parts, avoiding ordinary floating-point boundary errors.
- Display sizes are rounded; desktop hover text and CSV provide exact byte counts.

For example, `social-square.jpg` is 35,793 bytes. It passes a `0.035793` MB limit and fails a `0.035792` MB limit.

### Result meanings

| State | Meaning and consequence |
| --- | --- |
| Checking… | File reading/decoding is still pending; export remains disabled |
| Passed | Processing completed with no applicable failure reasons under the valid specification |
| Needs attention | An unreadable/unsupported file or one or more delivery requirements failed |
| Check paused | A completed image cannot be evaluated because the specification is invalid; export is disabled |

Failures may accumulate. A WebP banner can fail both dimensions and the allowed-format rule. A damaged file may also exceed the maximum size. Unknown dimensions are shown as a dash and exported as empty fields; they are never invented.

## Samples and expected outcomes

The six regular examples are actual encoded images. The app processes them through the same decoding and checking path as user-selected files. Results are not hard-coded.

| Filename | Format | Dimensions | Exact bytes | Original square result |
| --- | --- | --- | ---: | --- |
| `social-square.jpg` | JPG | 1080 × 1080 | 35,793 | PASS |
| `studio-square.png` | PNG | 1080 × 1080 | 8,370 | PASS |
| `small-square.jpg` | JPG | 800 × 800 | 17,770 | FAIL: dimensions |
| `website-banner.webp` | WebP | 1920 × 640 | 9,818 | FAIL: dimensions and format |
| `texture-large.png` | PNG | 1080 × 1080 | 3,504,560 | FAIL: file size |
| `product-detail.jpg` | JPG | 1600 × 1600 | 60,367 | FAIL: dimensions |

The product example passes only `product-detail.jpg`; the banner example passes only `website-banner.webp`. Changing the square example's limit from 2 MB to 4 MB makes `texture-large.png` pass and raises its pass count from two to three.

The large PNG contains actual noise pixel data exceeding 3.5 MB. The other examples use geometric artwork. `samples/manifest.json` records their metadata. `samples/sample-data.js` embeds byte-for-byte copies, loaded on demand as a local script so the sample button works under `file://` without `fetch` or a server.

### Invalid-file demonstration

Clear the results and drag all six files from `samples/invalid/` into the dashed area. If using a file picker, choose its All files option if necessary.

| Fixture | Expected failure |
| --- | --- |
| `not-an-image.jpg` | Plain text disguised as JPG; unrecognized data |
| `empty.png` | Empty, zero-byte file |
| `damaged.jpg` | Recognizable JPEG signature but no decodable image |
| `damaged.png` | Recognizable PNG signature but damaged payload |
| `damaged.webp` | Recognizable WebP signature but damaged payload |
| `unsupported.gif` | Actual GIF; unsupported by this checker |

**Success sign:** all six show Needs attention. These fixtures are deliberately excluded from the Try sample images button.

## CSV report contract

Select **Export CSV** once processing is complete and the specification is valid. The downloaded filename is `image-delivery-report.csv`. Active list filters do not limit the report: every loaded file is exported in its list order.

| Column | Meaning |
| --- | --- |
| Filename | Original filename |
| Width (px) | Decoded displayed width; empty when unavailable |
| Height (px) | Decoded displayed height; empty when unavailable |
| Detected format | JPG, PNG, WebP, another recognized label, or Unknown |
| File size (bytes) | Exact original byte count |
| File size (MB) | Decimal MB formatted to six fractional places |
| Status | PASS or FAIL |
| Reasons | All applicable reasons, joined with ` \| `; empty for a pass |
| Specification | Name of the selected specification at export time |
| Dimension rule | Exactly or At least |
| Required width (px) | Selected width requirement |
| Required height (px) | Selected height requirement |
| Allowed formats | Accepted format labels separated by semicolons |
| Maximum size (bytes) | Integer-byte limit |
| Maximum size (MB) | Selected decimal-MB limit |
| Report time (UTC) | ISO timestamp shared by the records in that export |

The file uses UTF-8 with a byte-order mark, CRLF record separators and double-quoted cells. Embedded quotes are doubled; commas, Unicode and newlines are preserved within cells. Formula-like values are prefixed with an apostrophe to reduce spreadsheet formula-execution risk. Depending on the spreadsheet application, that apostrophe may be visible.

**Success sign:** exporting the original six samples under the square specification produces one header and six data records: two PASS and four FAIL. The report provides the requirement context needed to interpret results later, but it cannot be imported to restore the checker.

## Implementation and file organization

### Application responsibilities

| File | Responsibility |
| --- | --- |
| `index.html` | Page structure, labels, controls, result table, local resources and Content Security Policy |
| `styles.css` | Colors, typography, layout, focus treatments, result states and responsive rules |
| `core.js` | Pure specification parsing, signature detection, validation comparisons, formatting and CSV serialization |
| `app.js` | DOM interactions, session state, two-worker file queue, decoding, thumbnail URLs, filters, presets and downloads |
| `assets/icon.svg` | Local application icon |
| `samples/` | Six real image files, embedded copies, manifest and invalid fixtures |

`core.js` exposes `ImageChecker` in the browser and a CommonJS export for Node tests. `app.js` runs in an isolated function and uses that API. Classic deferred scripts avoid a module-loading or bundling requirement for direct local-file use.

Each image entry tracks an ID, name, original byte count, pending/cancelled state, detected format, dimensions, error and thumbnail URL. A temporary `File` reference is cleared when processing finishes. Changing a specification recalculates results from existing metadata instead of decoding every image again.

The original object URL is revoked after decoding. Removing or clearing results revokes their thumbnail URLs, marks entries cancelled and prevents completed work for removed entries from restoring those rows. The original files are read only.

CSV generation uses a temporary Blob URL and a download link; that URL is revoked after 30 seconds. Filename text is rendered using DOM text APIs rather than inserted as HTML.

### Documentation, tests and evidence

| Location | Contents |
| --- | --- |
| `README.md` | Delivered usage instructions and release verification summary |
| `TEST_EVIDENCE.md` | Actual test commands, logs, screenshots, scope and limitations |
| `tests/core.test.cjs` | 16 logic and sample-integrity tests |
| `tests/delivery-smoke.cjs` | Optional browser delivery-verification harness |
| `tests/verify-package.py` | Standard-library Python ZIP/source-preservation verification |
| `evidence/` | TAP output, historical and final browser results, screenshots, syntax log and actual CSV downloads |
| `PROJECT_GUIDE.md` | This standalone guide, added after the verified release was packaged |

The frozen release ZIP contains 33 files. This guide is delivered separately; adding it beside the extracted project does not make it part of that original archive or change the archive's verification record.

## Privacy, accessibility and responsive behavior

### Local application privacy

The application has no analytics, remote API calls, externally loaded fonts or accounts. Its Content Security Policy uses `connect-src 'none'`, allows local scripts/styles and permits the local/blob/data images needed for previews. The recorded offline browser tests observed no HTTP requests.

There is no persistent browser storage. Reloading loses session state. CSV reports contain filenames and client requirements; users should share those reports only with their intended recipients. Publishing this project's code and development session on AgentGit is separate from using the app: checking personal images in the app does not upload those images to AgentGit.

### Interface behavior

The desktop interface places specification controls beside the upload area and result table. At narrower widths the sections stack; at phone widths result rows reflow to avoid horizontal page scrolling. Controls include labels, focus styles, a skip link, live status announcements, pressed states for filters and named remove buttons. Success and failure have text labels and symbols as well as color. Reduced-motion preferences disable transitions.

These are implementation details, not an accessibility certification. The recorded checks include keyboard activation of the file picker and viewport checks, but not a screen-reader audit or a complete WCAG assessment. Opening local HTML on an actual phone also depends on its browser and file manager.

## Test evidence and reproducibility

### What was actually verified

The recorded application tests are dated **November 6, 2026**. This November 7 guide summarizes them; it does not claim a new application regression run.

| Evidence set | Recorded result | Scope |
| --- | --- | --- |
| Core tests | 16 passed, 0 failed | Specification boundaries, comparison reasons, CSV escaping, signatures and sample-copy equality |
| Earlier full browser regression | 24 groups passed | Real decoding, presets/custom drafts, invalid settings/files, byte/pixel boundaries, EXIF, 30-file batches, 200-file capacity, drag events, removal, hostile names and export |
| Final source-folder browser check | 7 groups passed | Offline opening, sample/README/manifest agreement, presets, filtered CSV, responsive screenshots, invalid fixtures and browser health |
| Final extracted-ZIP browser check | Same 7 groups passed | Direct offline use after extraction to a different path containing spaces and Chinese characters |
| Archive verification | Passed | CRC, complete member list, byte equality, resource closure, documentation links and preservation of 20 pre-finalization source/sample/test files |

The finalization browser groups are a narrower repeat of critical flows. They are not 14 additional unique features or a rerun of the earlier 24-group suite. The original 24-group temporary harness was removed after its run; its result log remains available.

**Recorded environment:** Windows; Chrome 156.0.8078.80; Playwright 1.62.1; Node 24.16.0. Browser execution used an isolated headless session with `offline: true` and direct `file://` navigation. Widths 320, 390, 768, 1024 and 1536 pixels were checked. Desktop and mobile full-page screenshots were inspected. No application runtime errors, console warnings/errors or external HTTP requests were observed in the recorded final checks.

### Evidence locations inside the verified ZIP

- `evidence/core-tests.txt`: TAP results for the 16 core tests.
- `evidence/browser-regression-2026-11-06.json`: the earlier 24-group results.
- `evidence/delivery-browser-results.json`: final 7-group results and environment.
- `evidence/delivery-browser-console.txt`: final browser command output.
- `evidence/desktop.png` and `evidence/mobile.png`: full-page captures from 1536 × 1024 and 390 × 844 viewports.
- `evidence/sample-report.csv` and `evidence/invalid-report.csv`: actual downloaded reports.
- `evidence/syntax-checks.txt`: recorded JavaScript syntax-check outcomes.

### Optional developer checks

These commands verify the implementation without being necessary to use the app. Open a terminal in an extracted project directory. Node must already be installed for the first group:

```text
node --check core.js
node --check app.js
node --check tests/delivery-smoke.cjs
node --test --test-reporter=tap tests/core.test.cjs
```

**Success sign:** syntax checks exit successfully and the test output reports 16 passes and zero failures. These checks read the project; they do not regenerate the delivered evidence files.

Browser verification additionally needs an available Playwright installation and browser executable. `PLAYWRIGHT_MODULE` can identify the installed module; `CHROME_PATH` can identify Chrome. Use paths valid on your own machine. To preserve the delivered evidence, direct new output to a separate directory:

```text
node tests/delivery-smoke.cjs . ../image-delivery-checker-new-qa
```

**Success sign:** seven groups pass and the chosen output directory contains new JSON results, screenshots and CSV downloads. This command launches a local browser and writes those QA files. Do not run it with its default output directory if you intend to keep the original `evidence/` unchanged.

`tests/verify-package.py` checks a ZIP against its associated project tree and requires an explicit previous ZIP through `--baseline`. An optional `--extract-to` destination must not already exist. It writes external `.verification.json` and `.sha256` sidecars. Use the unmodified 33-file release tree when reproducing its original archive comparison: a tree with this newly added guide intentionally contains one extra file. Exact historical commands are recorded in `TEST_EVIDENCE.md`.

## Known limits and troubleshooting

### Verification limits

Safari, Firefox, Edge, physical phones/tablets, screen readers, OS-level mouse dragging, unusual color profiles, every corrupt or animated image variant and forced decoder timeout were not tested. Earlier drag-and-drop tests used browser File/DataTransfer events, not an OS mouse-drag recording.

This is not forensic file validation. A browser may decode and tolerate some malformed or truncated data. The app does not validate every file byte or metadata structure, nor does it check animation frames, color profile, print DPI, transparency, embedded metadata, visual quality or naming conventions. Large compressed images can still consume substantial memory after decoding despite the 50 MB input limit. The timeout should not be interpreted as a guaranteed hard limit on browser memory or CPU usage.

### Troubleshooting table

| Symptom | What to do | Success sign |
| --- | --- | --- |
| No styling or inactive controls | Extract the entire ZIP; keep folders together; open in a browser with JavaScript enabled | Styled page and working sample button |
| Sample button fails | Restore `samples/sample-data.js` to its original location, or browse for the six actual images | Six decoded thumbnails |
| Check paused | Fix the invalid name/dimensions/size or select at least one format | Normal results resume and export becomes available after processing |
| CSV seems missing | Check browser Downloads and download settings | `image-delivery-report.csv` appears |
| CSV contains more rows than the filter | Expected: export includes all loaded files | Record count matches total images |
| A renamed image has an unexpected format label | Actual bytes determine format; rename separately if the client requires an extension convention | Label matches the true encoded format |
| Changes disappear after reopening | Expected session-only behavior; keep the page open and export before leaving | A report is retained outside the browser session |
| New files are not all added | Check the 200-file capacity notice; clear results and add the remainder | Every intended file is accounted for across batches |
| A file cannot be decoded | Read its reason, verify the file independently, then select a valid supported image | Decoded dimensions and a result appear |

## Release integrity and AgentGit publication

### Verified release identity

| Property | Value |
| --- | --- |
| Archive | `image-delivery-checker.zip` |
| Archive size | 7,430,898 bytes |
| Files inside the archive | 33 |
| Application version | 1.0.0 |
| Published release-file commit | `d11dd758c4351bd2ec427e7ced9dd181549ae257` |

Archive SHA-256:

```text
89860400bed1cfba9363eb8fe88b509d1f0e1ae1766f8f1aba9ca31b97e886b9
```

The final ZIP was checked for CRC errors, extracted, compared byte for byte with its release files and exercised offline. Its uploaded copy was then downloaded through an anonymous Git clone and compared with the local final ZIP, uploaded checksum and verification report. That recorded publication check passed.

The original archive and its sidecars are intentionally preserved. This later guide is a separate documentation deliverable and is not silently inserted into the verified ZIP.

### Public review links

- [Project Hub](https://agent-git.com/@fosterhrljz/image-delivery-checker)
- [Authentic development session](https://agent-git.com/@fosterhrljz/image-delivery-checker/s/agit-4a05754ad0b38c6fe4fab36516c7d69ca475fa8b?ref=page-id-null-feae)
- [Verified release ZIP at its immutable commit](https://agent-git.com/@fosterhrljz/image-delivery-checker?tab=files&ref=d11dd758c4351bd2ec427e7ced9dd181549ae257&file=artifacts/image-delivery-checker.zip)
- [Release checksum](https://agent-git.com/@fosterhrljz/image-delivery-checker?tab=files&ref=d11dd758c4351bd2ec427e7ced9dd181549ae257&file=artifacts/image-delivery-checker.zip.sha256)
- [Release verification report](https://agent-git.com/@fosterhrljz/image-delivery-checker?tab=files&ref=d11dd758c4351bd2ec427e7ced9dd181549ae257&file=artifacts/image-delivery-checker.zip.verification.json)

The project repository is public. The authentic Codex session contains the original build and final-delivery work. Release files were published on AgentGit's shared `main` file line, separate from the session branch. On the Hub, **Show shared files** reveals these artifacts. Publishing this guide uses that same official file workflow, with only this document staged, committed and pushed. It does not rewrite the development session or enable automatic future uploads, which were explicitly turned off.

The README and test document inside the frozen ZIP describe the state at packaging time, including its then-unpublished status. The later public publication recorded here does not require altering those historical release files.

## Maintenance and handoff

The current deliverable is complete within its first-version scope. Application code, styling, sample files, original evidence and release artifacts remain the baseline for any future work. A separate request should define any behavior changes.

For documentation maintenance, verify claims against `core.js`, `app.js`, the sample manifest and actual evidence. Distinguish recorded historical tests from newly executed checks, preserve exact size units and do not turn untested compatibility into a support claim. If an application change is authorized later, update relevant tests and evidence, then create a separately verified release instead of silently replacing the old archive.

### Reviewer checklist

1. Open the public Hub and inspect the authentic development session.
2. Download the pinned verified ZIP and, if needed, check its SHA-256 against the value above.
3. Extract it and open `index.html` offline.
4. Try the samples: expect two passes and four failures under the original square example.
5. Change the maximum to 4 MB: expect three passes. Restore the example afterward.
6. Try the six invalid fixtures: expect six failures with reasons.
7. Export while filtered to Passed: the CSV should still contain all loaded files.
8. Read `TEST_EVIDENCE.md`, including its explicit untested scope.

**Handoff boundary:** this guide is documentation only. It does not introduce features, change validation rules, regenerate tests, modify other project files, rebuild the ZIP or authorize automatic future publication.

---

End of project guide.

# Test evidence — final delivery

Verified 2026-11-06 on Windows, Node 24.16.0, Playwright 1.62.1 and Chrome 156.0.8078.80. Browser checks used an isolated headless session, direct `file://` navigation and `offline: true`. No server or signed-in profile was used. The in-app browser connection timed out in the earlier session; the established local Playwright fallback was reused.

## Commands actually run

From the project folder, in PowerShell:

```powershell
node --check core.js
node --check app.js
node --check tests/delivery-smoke.cjs
node --test --test-reporter=tap tests/core.test.cjs
$env:PLAYWRIGHT_MODULE = 'C:/Users/TTK/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node tests/delivery-smoke.cjs
```

The absolute paths above identify the existing tools actually used; they are not app dependencies. On another machine, use its Playwright location and Chrome executable. The optional scripts are included; running the app itself needs neither Node nor Python.

| Final source-folder check | Observed result / evidence |
| --- | --- |
| JavaScript syntax | All 3 commands exited 0: [syntax log](evidence/syntax-checks.txt) |
| Logic, CSV escaping and embedded/real sample equality | 16 passed, 0 failed: [TAP log](evidence/core-tests.txt) |
| Offline browser delivery checks | 7 groups passed: [structured results](evidence/delivery-browser-results.json), [command output](evidence/delivery-browser-console.txt) |
| Sample dimensions, formats, original bytes and README table | All six agreed; square example 2 PASS / 4 FAIL; product and banner 1 PASS each |
| Filtered export | Actual download still contained all 6 records: [sample CSV](evidence/sample-report.csv) |
| Six invalid/unsupported fixtures | All 6 FAIL with specific reasons: [invalid CSV](evidence/invalid-report.csv) |
| Browser health | 0 app runtime errors, console warnings/errors or HTTP requests observed |
| Responsive checks | No page overflow at 320, 390, 768, 1024 and 1536 px; screenshots visually inspected |

Screenshots from this final source-folder run: [desktop, 1536 × 1024 viewport](evidence/desktop.png) and [mobile, 390 × 844 viewport](evidence/mobile.png). Both are full-page captures, so their image heights exceed the viewport heights. Page identity, meaningful rendering and the absence of an error overlay were checked through assertions and screenshot inspection.

## Earlier regression evidence

The earlier command was `node image-delivery-qa/verify.cjs` from the workspace. Its [24-group result log](evidence/browser-regression-2026-11-06.json) is retained unchanged. That temporary harness was removed after the original run, so it is not included or presented as rerunnable. Its coverage included 30-file batches, byte/pixel boundaries, EXIF rotation, signature/extension mismatch, drag events, invalid specifications, custom specifications, removal, capacity limits and hostile filenames. The final 7-group harness is narrower; it does not replace or claim to rerun all 24 groups.

## Final ZIP verification

After packaging, these commands were run from the project folder (the two environment variables above were still set):

```powershell
$qaPython = 'C:/Users/TTK/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
& $qaPython tests/verify-package.py ../image-delivery-checker.zip --baseline ../image-delivery-qa/image-delivery-checker-before-final.zip --extract-to '../image-delivery-qa/final extracted 空格'
node tests/delivery-smoke.cjs '../image-delivery-qa/final extracted 空格/image-delivery-checker' '../image-delivery-qa/final-extracted-evidence'
```

ZIP CRC, exact member bytes, required local resources and documentation links passed. All 20 prior application/sample/test files, excluding the intentionally updated README, matched the previous ZIP byte for byte. The extracted copy passed the same 7 offline browser groups, including real samples, invalid files and CSV downloads. No application/design files were changed.

The final archive's SHA-256 and full member verification are supplied beside the ZIP as `image-delivery-checker.zip.sha256` and `image-delivery-checker.zip.verification.json`. They stay outside the ZIP to avoid a self-referential archive hash. Extracted-copy browser logs are retained in the workspace under `image-delivery-qa/final-extracted-evidence/`; the included source-folder logs and screenshots are the ones linked above.

## Not tested / limits of this evidence

Safari, Firefox, Edge, physical mobile devices, screen readers, OS-level mouse dragging, unusual color profiles, all possible corrupt/animated images, and forced decoder timeout were not tested. Earlier drag testing dispatched real browser File/DataTransfer events; it was not an OS mouse-drag recording. Mobile checks emulate viewport sizes. Browser decoding is not forensic file validation. This final pass did not rerun every earlier regression case or add any features.

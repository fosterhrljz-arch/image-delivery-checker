"""Optional, standard-library-only package QA. Does not modify the app or ZIP.
Usage: python tests/verify-package.py ARCHIVE --baseline PREVIOUS_ZIP
       [--extract-to NEW_DIRECTORY]
Writes ARCHIVE.verification.json and ARCHIVE.sha256 outside the archive.
"""
import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path, PurePosixPath
from html.parser import HTMLParser

parser = argparse.ArgumentParser()
parser.add_argument('archive', type=Path)
parser.add_argument('--baseline', type=Path, required=True)
parser.add_argument('--extract-to', type=Path)
args = parser.parse_args()
project = Path(__file__).resolve().parent.parent
prefix = project.name + '/'
sha256 = lambda data: hashlib.sha256(data).hexdigest()

class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src', 'href') and value and not value.startswith('#'):
                self.refs.append(value)

html = (project / 'index.html').read_text(encoding='utf-8')
resources = Resources()
resources.feed(html)
assert all(':' not in ref and not ref.startswith('/') for ref in resources.refs)
required = resources.refs + ['index.html', 'samples/sample-data.js', 'samples/manifest.json', 'README.md', 'TEST_EVIDENCE.md', 'tests/core.test.cjs', 'tests/delivery-smoke.cjs', 'evidence/core-tests.txt', 'evidence/delivery-browser-results.json', 'evidence/browser-regression-2026-11-06.json', 'evidence/desktop.png', 'evidence/mobile.png']
assert all((project / name).is_file() for name in required)
assert "connect-src 'none'" in html
for markdown in ['README.md', 'TEST_EVIDENCE.md']:
    for link in re.findall(r'\]\(([^)]+)\)', (project / markdown).read_text(encoding='utf-8')):
        if not link.startswith(('http:', 'https:', '#')):
            assert (project / link.split('#')[0]).is_file(), f'Broken documentation link: {link}'

files = {prefix + p.relative_to(project).as_posix(): p for p in project.rglob('*') if p.is_file()}
unchanged = {}
with zipfile.ZipFile(args.baseline) as old:
    for name in old.namelist():
        if name.endswith('/') or name == prefix + 'README.md':
            continue
        assert name in files, f'Missing prior source: {name}'
        digest = sha256(files[name].read_bytes())
        assert digest == sha256(old.read(name)), f'Prior application/sample/test changed: {name}'
        unchanged[name.removeprefix(prefix)] = digest

with zipfile.ZipFile(args.archive) as archive:
    assert archive.testzip() is None, 'ZIP CRC failure'
    names = archive.namelist()
    assert len(names) == len(set(names)), 'Duplicate ZIP member'
    assert set(names) == set(files), 'ZIP and project file lists differ'
    for name in names:
        assert name.startswith(prefix) and '..' not in PurePosixPath(name).parts
        assert archive.read(name) == files[name].read_bytes(), f'ZIP bytes differ: {name}'
    if args.extract_to:
        assert not args.extract_to.exists(), 'Use a new extraction directory'
        args.extract_to.mkdir(parents=True)
        archive.extractall(args.extract_to)
        for name in names:
            assert sha256((args.extract_to / name).read_bytes()) == sha256(files[name].read_bytes())

report = {'date': '2026-11-06', 'status': 'PASS', 'archive': args.archive.name, 'bytes': args.archive.stat().st_size, 'sha256': sha256(args.archive.read_bytes()), 'file_count': len(files), 'zip_crc': 'PASS', 'member_bytes_equal_project': 'PASS', 'required_offline_resources': 'PASS', 'documentation_links': 'PASS', 'baseline_zip_sha256': sha256(args.baseline.read_bytes()), 'unchanged_prior_files': unchanged, 'extracted_to': str(args.extract_to) if args.extract_to else None, 'file_sha256': {name: sha256(p.read_bytes()) for name, p in files.items()}}
Path(str(args.archive) + '.verification.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
Path(str(args.archive) + '.sha256').write_text(report['sha256'] + '  ' + args.archive.name + '\n', encoding='utf-8')
print(f'PASS: {len(files)} ZIP members; CRC, byte equality, resources and documentation links; {len(unchanged)} prior source/sample/test files unchanged.')
print(f'SHA-256: {report["sha256"]}')

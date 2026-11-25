"""Build the KUAL diagnostic ZIP without installing or contacting anything."""
from pathlib import Path
import zipfile


def package():
    root = Path(__file__).resolve().parents[1]
    extension = root / 'extensions' / 'kindle-weather-check'
    output = root / 'dist' / 'kindle-weather-check.zip'
    output.parent.mkdir(exist_ok=True)
    files = [p for p in extension.rglob('*') if p.is_file()
             and 'results' not in p.relative_to(extension).parts
             and '__pycache__' not in p.parts and p.suffix != '.pyc']
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(files):
            archive.write(path, path.relative_to(root))
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise RuntimeError('ZIP validation failed')
    print(output)
    return output


if __name__ == '__main__':
    package()

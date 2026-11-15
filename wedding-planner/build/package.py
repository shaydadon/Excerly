"""Packs dist/ into the 5 files you upload to an Etsy digital listing (Etsy limit: 5 files, 20 MB each).
Run: python3 build/package.py  ->  dist/Etsy-Upload/
"""
import os, zipfile, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'dist')
U = os.path.join(D, 'Etsy-Upload')
shutil.rmtree(U, ignore_errors=True)
os.makedirs(U)

shutil.copy(os.path.join(D, '00-START-HERE.pdf'), os.path.join(U, '1-START-HERE.pdf'))
shutil.copy(os.path.join(D, 'The-Wedding-Planner_Digital-Hyperlinked.pdf'), os.path.join(U, '2-The-Wedding-Planner_Digital-Hyperlinked.pdf'))
shutil.copy(os.path.join(D, 'The-Wedding-Planner_Printable_US-Letter.pdf'), os.path.join(U, '3-The-Wedding-Planner_Printable_US-Letter.pdf'))
shutil.copy(os.path.join(D, 'The-Wedding-Planner_Printable_A4.pdf'), os.path.join(U, '4-The-Wedding-Planner_Printable_A4.pdf'))
with zipfile.ZipFile(os.path.join(U, '5-Invitations-Spreadsheet-and-App.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
    base = os.path.join(D, 'Invitation-Suite')
    for dp, _, fs in os.walk(base):
        for f in sorted(fs):
            z.write(os.path.join(dp, f), os.path.join('Invitation-Suite_40-Designs', os.path.relpath(os.path.join(dp, f), base)))
    z.write(os.path.join(D, 'The-Wedding-Planner_Spreadsheet.xlsx'), 'The-Wedding-Planner_Spreadsheet.xlsx')
    z.write(os.path.join(D, 'Wedding-Planner-App_offline.html'), 'Wedding-Planner-App_offline.html')
    z.write(os.path.join(D, '00-START-HERE.pdf'), 'START-HERE_Canva-links-on-page-2.pdf')

for f in sorted(os.listdir(U)):
    mb = os.path.getsize(os.path.join(U, f)) / 1e6
    print(f'{"✓" if mb < 20 else "✗ TOO BIG"} {f}  {mb:.1f} MB')

"""Companion spreadsheet: works in Excel, Google Sheets and Numbers.
Run: python3 build/spreadsheet.py  ->  dist/The-Wedding-Planner_Spreadsheet.xlsx
"""
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule, CellIsRule
from openpyxl.chart import PieChart, Reference

INK, ACC, SOFT, WASH, LINE, PAPER = '2E2A27', 'A3845F', '6F665F', 'F7F2EB', 'DCD3C8', 'FBF8F3'
SERIF, SANS = 'Georgia', 'Arial'  # available in Excel, Google Sheets and Numbers
thin = Side(style='thin', color=LINE)
B = Border(bottom=thin)
CUR = '#,##0;-#,##0;"–"'

wb = Workbook()


def sheet(title, heading, sub, widths, tab=ACC):
    ws = wb.create_sheet(title)
    ws.sheet_properties.tabColor = tab
    ws.sheet_view.showGridLines = False
    for i, w in enumerate(widths):
        ws.column_dimensions[chr(65 + i)].width = w
    ws['A1'] = heading
    ws['A1'].font = Font(name=SERIF, size=26, color=INK)
    ws['A2'] = sub
    ws['A2'].font = Font(name=SANS, size=9, color=SOFT, italic=True)
    ws.row_dimensions[1].height = 38
    return ws


def header(ws, row, cols):
    for i, c in enumerate(cols):
        cell = ws.cell(row=row, column=i + 1, value=c.upper())
        cell.font = Font(name=SANS, size=8, color=SOFT, bold=True)
        cell.fill = PatternFill('solid', fgColor=WASH)
        cell.alignment = Alignment(vertical='center', wrap_text=True)
        cell.border = Border(bottom=Side(style='medium', color=INK))
    ws.row_dimensions[row].height = 26
    ws.freeze_panes = ws.cell(row=row + 1, column=1)


def body(ws, r1, r2, ncols, money=()):
    for r in range(r1, r2 + 1):
        ws.row_dimensions[r].height = 20
        for c in range(1, ncols + 1):
            cell = ws.cell(row=r, column=c)
            cell.font = Font(name=SANS, size=10, color=INK)
            cell.border = B
            cell.alignment = Alignment(vertical='center')
            if c in money:
                cell.number_format = CUR


# ── Budget ──
from importlib.machinery import SourceFileLoader  # noqa
budget_lines = [
    ('Venue', ['Ceremony venue', 'Reception venue', 'Venue fees & permits']),
    ('Food & Drink', ['Catering', 'Service charge & staff', 'Bar & alcohol', 'Active / mobile bar', 'Cake & desserts']),
    ('Photo & Film', ['Photographer', 'Videographer', 'Album & prints']),
    ('Entertainment', ['DJ / band', 'Ceremony musicians', 'Photo booth & extras']),
    ('Flowers & Décor', ['Florist', 'Décor & design', 'Rentals', 'Lighting']),
    ('Attire & Beauty', ['Wedding dress & alterations', 'Suit / tuxedo', 'Accessories & shoes', 'Hair & makeup']),
    ('Ceremony', ['Officiant', 'Marriage license', 'Rings']),
    ('Paper & Gifts', ['Stationery & postage', 'Favors', 'Wedding party gifts']),
    ('Logistics', ['Transportation', 'Guest accommodation', 'Wedding planner', 'Insurance', 'Tips']),
]
ws = sheet('Budget', 'Budget', 'Type in the light cells. Balances, totals and the dashboard update on their own.', [30, 18, 14, 14, 14, 14, 30])
ws['A4'], ws['B4'] = 'TOTAL BUDGET', 35000
ws['A4'].font = Font(name=SANS, size=9, color=ACC, bold=True)
ws['B4'].font = Font(name=SERIF, size=18, color=INK)
ws['B4'].number_format = CUR
ws['B4'].fill = PatternFill('solid', fgColor=WASH)
header(ws, 6, ['Item', 'Category', 'Estimated', 'Actual', 'Paid', 'Balance', 'Notes'])
r = 7
for cat, items in budget_lines:
    for it in items:
        ws.cell(row=r, column=1, value=it)
        ws.cell(row=r, column=2, value=cat).font = Font(name=SANS, size=9, color=SOFT)
        ws.cell(row=r, column=6, value=f'=IF(D{r}="","",D{r}-E{r})')
        r += 1
for _ in range(5):
    r += 1
last = r - 1
body(ws, 7, last, 7, money=(3, 4, 5, 6))
for rr in range(7, last + 1):
    ws.cell(row=rr, column=2).font = Font(name=SANS, size=9, color=SOFT)
tr = last + 1
ws.cell(row=tr, column=1, value='TOTAL')
for c, col in [(3, 'C'), (4, 'D'), (5, 'E'), (6, 'F')]:
    ws.cell(row=tr, column=c, value=f'=SUM({col}7:{col}{last})').number_format = CUR
for c in range(1, 8):
    ws.cell(row=tr, column=c).font = Font(name=SANS, size=10, bold=True, color=INK)
    ws.cell(row=tr, column=c).border = Border(top=Side(style='medium', color=INK))
ws.cell(row=tr + 1, column=1, value='LEFT TO SPEND (budget – estimated)').font = Font(name=SANS, size=9, color=ACC, bold=True)
ws.cell(row=tr + 1, column=3, value=f'=B4-C{tr}').number_format = CUR
ws.conditional_formatting.add(f'C{tr + 1}', CellIsRule(operator='lessThan', formula=['0'], font=Font(color='B0413E', bold=True)))
BUDGET_TOTAL_ROW, BUDGET_LAST = tr, last

# ── Guests ──
ws = sheet('Guest List', 'Guest List', 'One row per invitation. Party size counts everyone on it. Choose from the drop-downs.', [5, 26, 9, 10, 16, 30, 26, 13, 14, 9, 22, 22, 10])
cols = ['#', 'Name(s)', 'Party size', 'Side', 'Group', 'Address', 'Email / phone', 'RSVP', 'Meal', 'Table', 'Dietary notes', 'Gift', 'Thank-you']
header(ws, 4, cols)
N = 250
for i in range(N):
    rr = 5 + i
    ws.cell(row=rr, column=1, value=i + 1).font = Font(name=SANS, size=8, color=SOFT)
body(ws, 5, 4 + N, 13)
for rr in range(5, 5 + N):
    ws.cell(row=rr, column=1).font = Font(name=SANS, size=8, color=SOFT)
dvs = [
    ('D', '"Partner 1,Partner 2,Both"'),
    ('E', '"Family,Friends,Work,Plus-one,Other"'),
    ('H', '"Awaiting,Attending,Declined"'),
    ('I', '"Meat,Fish,Vegetarian,Vegan,Child,Other"'),
    ('M', '"Yes,No"'),
]
for col, lst in dvs:
    dv = DataValidation(type='list', formula1=lst, allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f'{col}5:{col}{4 + N}')
ws.conditional_formatting.add(f'A5:M{4 + N}', FormulaRule(formula=['$H5="Attending"'], fill=PatternFill('solid', fgColor='EEF2EA')))
ws.conditional_formatting.add(f'A5:M{4 + N}', FormulaRule(formula=['$H5="Declined"'], font=Font(color='A69C92', strike=True)))
G = f"'Guest List'!"
GL = 4 + N

# ── Vendors ──
ws = sheet('Vendors', 'Vendors', 'Compare options, then mark the one you book. Status colors update automatically.', [22, 26, 18, 16, 26, 26, 14, 14, 14, 12, 30])
header(ws, 4, ['Category', 'Company', 'Contact', 'Phone', 'Email', 'Website / social', 'Quote', 'Deposit', 'Due date', 'Status', 'Notes'])
cats = ['Venue', 'Catering', 'Photographer', 'Videographer', 'DJ & Music', 'Bar & Alcohol', 'Active / Mobile Bar', 'Florist & Décor', 'Hair & Makeup', 'Attire', 'Officiant', 'Cake & Desserts', 'Stationery', 'Transportation', 'Photo Booth & Extras', 'Rentals & Lighting', 'Planner']
for i, c in enumerate(cats):
    ws.cell(row=5 + i, column=1, value=c)
VL = 5 + 59
body(ws, 5, VL, 11, money=(7, 8))
for rr in range(5, VL + 1):
    ws.cell(row=rr, column=9).number_format = 'dd mmm yyyy'
dv = DataValidation(type='list', formula1='"Researching,Contacted,Quoted,Booked,Paid in full,Not chosen"', allow_blank=True)
ws.add_data_validation(dv)
dv.add(f'J5:J{VL}')
dv = DataValidation(type='list', formula1='"' + ','.join(cats).replace('&', '&') + '"', allow_blank=True)
ws.add_data_validation(dv)
dv.add(f'A5:A{VL}')
ws.conditional_formatting.add(f'A5:K{VL}', FormulaRule(formula=['OR($J5="Booked",$J5="Paid in full")'], fill=PatternFill('solid', fgColor='EEF2EA')))
ws.conditional_formatting.add(f'A5:K{VL}', FormulaRule(formula=['$J5="Not chosen"'], font=Font(color='A69C92')))
ws.conditional_formatting.add(f'I5:I{VL}', FormulaRule(formula=[f'AND(I5<>"",I5-TODAY()<=14,$J5<>"Paid in full")'], font=Font(color='B0413E', bold=True)))

# ── Checklist ──
ws = sheet('Checklist', 'Checklist', 'Choose Done from the drop-down. Progress shows on the dashboard.', [18, 54, 12, 14, 30])
header(ws, 4, ['When', 'Task', 'Done', 'Due date', 'Notes'])
import json, subprocess
checklist = json.loads(subprocess.check_output(['node', '-e', "console.log(JSON.stringify(require('./build/content').checklist))"], cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
rr = 5
for g in checklist:
    for t in g['items']:
        ws.cell(row=rr, column=1, value=g['when'])
        ws.cell(row=rr, column=2, value=t)
        rr += 1
CL = rr + 9
body(ws, 5, CL, 5)
for x in range(5, CL + 1):
    ws.cell(row=x, column=1).font = Font(name=SANS, size=9, color=ACC)
    ws.cell(row=x, column=4).number_format = 'dd mmm yyyy'
dv = DataValidation(type='list', formula1='"Done,In progress"', allow_blank=True)
ws.add_data_validation(dv)
dv.add(f'C5:C{CL}')
ws.conditional_formatting.add(f'A5:E{CL}', FormulaRule(formula=['$C5="Done"'], font=Font(color='A69C92', strike=True)))

# ── Seating ──
ws = sheet('Seating', 'Seating', 'Type the table number in the Guest List; this sheet lists who sits where.', [10, 12, 60])
header(ws, 4, ['Table', 'Guests', 'Seated (from Guest List, attending only)'])
for t in range(1, 31):
    rr = 4 + t
    ws.cell(row=rr, column=1, value=t)
    ws.cell(row=rr, column=2, value=f"=SUMIFS({G}$C$5:$C${GL},{G}$J$5:$J${GL},A{rr},{G}$H$5:$H${GL},\"Attending\")")
    ws.cell(row=rr, column=3, value=f"=_xlfn.TEXTJOIN(\", \",TRUE,IF(({G}$J$5:$J${GL}=A{rr})*({G}$H$5:$H${GL}=\"Attending\"),{G}$B$5:$B${GL},\"\"))")
body(ws, 5, 34, 3)
for rr in range(5, 35):
    ws.cell(row=rr, column=3).alignment = Alignment(wrap_text=True, vertical='center')
    ws.formula_attributes = getattr(ws, 'formula_attributes', {})
    ws.conditional_formatting.add(f'B{rr}', CellIsRule(operator='greaterThan', formula=['10'], font=Font(color='B0413E', bold=True)))
# TEXTJOIN with IF over a range needs to be an array formula in older Excel
from openpyxl.worksheet.formula import ArrayFormula
for rr in range(5, 35):
    f = ws.cell(row=rr, column=3).value
    ws.cell(row=rr, column=3).value = ArrayFormula(f'C{rr}', f)

# ── Dashboard (first) ──
ws = wb['Sheet']
ws.title = 'Dashboard'
ws.sheet_properties.tabColor = INK
ws.sheet_view.showGridLines = False
for col, w in zip('ABCDEFG', [3, 30, 18, 4, 30, 18, 3]):
    ws.column_dimensions[col].width = w
ws['B2'] = 'The Wedding Planner'
ws['B2'].font = Font(name=SERIF, size=30, color=INK)
ws['B3'] = 'Your plan at a glance. Everything here is calculated from the other tabs.'
ws['B3'].font = Font(name=SANS, size=9, color=SOFT, italic=True)
ws['B5'], ws['C5'] = 'WEDDING DATE', None
ws['C5'].number_format = 'dd mmm yyyy'
ws['C5'].fill = PatternFill('solid', fgColor=WASH)
ws['E5'], ws['F5'] = 'DAYS TO GO', '=IF(C5="","Add your date",C5-TODAY())'

blocks = [
    ('B', 'C', 7, 'BUDGET', [
        ('Total budget', '=Budget!B4'),
        ('Estimated', f'=Budget!C{BUDGET_TOTAL_ROW}'),
        ('Actual', f'=Budget!D{BUDGET_TOTAL_ROW}'),
        ('Paid so far', f'=Budget!E{BUDGET_TOTAL_ROW}'),
        ('Still to pay', f'=Budget!F{BUDGET_TOTAL_ROW}'),
        ('Left to allocate', f'=Budget!B4-Budget!C{BUDGET_TOTAL_ROW}'),
    ], True),
    ('E', 'F', 7, 'GUESTS', [
        ('Invited (people)', f'=SUM({G}C5:C{GL})'),
        ('Attending', f'=SUMIF({G}H5:H{GL},"Attending",{G}C5:C{GL})'),
        ('Declined', f'=SUMIF({G}H5:H{GL},"Declined",{G}C5:C{GL})'),
        ('Awaiting reply', f'=SUM({G}C5:C{GL})-F9-F10'),
        ('Response rate', '=IF(F8=0,"–",(F9+F10)/F8)'),
        ('Cost per attending guest', f'=IF(F9=0,"–",Budget!D{BUDGET_TOTAL_ROW}/F9)'),
    ], False),
    ('B', 'C', 15, 'MEALS (ATTENDING)', [(m, f'=SUMIFS({G}C5:C{GL},{G}I5:I{GL},"{m}",{G}H5:H{GL},"Attending")') for m in ['Meat', 'Fish', 'Vegetarian', 'Vegan', 'Child', 'Other']], False),
    ('E', 'F', 15, 'PROGRESS', [
        ('Checklist tasks done', f'=COUNTIF(Checklist!C5:C{CL},"Done")&" of "&COUNTA(Checklist!B5:B{CL})'),
        ('Checklist complete', f'=IFERROR(COUNTIF(Checklist!C5:C{CL},"Done")/COUNTA(Checklist!B5:B{CL}),0)'),
        ('Vendors booked', f'=COUNTIF(Vendors!J5:J{VL},"Booked")+COUNTIF(Vendors!J5:J{VL},"Paid in full")'),
        ('Thank-you notes sent', f'=COUNTIF({G}M5:M{GL},"Yes")'),
        ('Gifts received', f'=COUNTA({G}L5:L{GL})'),
        ('Tables in use', '=COUNTIF(Seating!B5:B34,">0")'),
    ], False),
]
for kc, vc, r0, title, rows, money in blocks:
    ws[f'{kc}{r0}'] = title
    ws[f'{kc}{r0}'].font = Font(name=SANS, size=8, bold=True, color=ACC)
    ws[f'{kc}{r0}'].border = Border(bottom=Side(style='medium', color=INK))
    ws[f'{vc}{r0}'].border = Border(bottom=Side(style='medium', color=INK))
    for i, (k, f) in enumerate(rows):
        rr = r0 + 1 + i
        ws[f'{kc}{rr}'] = k
        ws[f'{vc}{rr}'] = f
        ws[f'{kc}{rr}'].font = Font(name=SANS, size=10, color=INK)
        ws[f'{vc}{rr}'].font = Font(name=SERIF, size=14, color=INK)
        ws[f'{vc}{rr}'].alignment = Alignment(horizontal='right')
        for c in (kc, vc):
            ws[f'{c}{rr}'].border = B
        ws.row_dimensions[rr].height = 22
        if money or 'Cost' in k:
            ws[f'{vc}{rr}'].number_format = CUR
        if 'rate' in k or 'complete' in k:
            ws[f'{vc}{rr}'].number_format = '0%'
for c in ('B5', 'E5'):
    ws[c].font = Font(name=SANS, size=8, bold=True, color=ACC)
ws['F5'].font = Font(name=SERIF, size=20, color=ACC)
ws['C5'].font = Font(name=SERIF, size=14, color=INK)

# category pie from budget estimates
ws['B23'] = 'ESTIMATED SPEND BY CATEGORY'
ws['B23'].font = Font(name=SANS, size=8, bold=True, color=ACC)
for i, (cat, _) in enumerate(budget_lines):
    ws.cell(row=24 + i, column=2, value=cat).font = Font(name=SANS, size=10)
    ws.cell(row=24 + i, column=3, value=f'=SUMIF(Budget!B7:B{BUDGET_LAST},B{24 + i},Budget!C7:C{BUDGET_LAST})').number_format = CUR
    for c in (2, 3):
        ws.cell(row=24 + i, column=c).border = B
pie = PieChart()
pie.add_data(Reference(ws, min_col=3, min_row=24, max_row=24 + len(budget_lines) - 1))
pie.set_categories(Reference(ws, min_col=2, min_row=24, max_row=24 + len(budget_lines) - 1))
pie.title = None
pie.height, pie.width = 7.5, 11
from openpyxl.chart.series import DataPoint
from openpyxl.chart.label import DataLabelList
for i, col in enumerate(['2E2A27', 'A3845F', 'C9B79F', '8C9B80', 'DCCFBE', '6F665F', 'E8DFD2', 'B9A27F', 'A69C92']):
    pt = DataPoint(idx=i)
    pt.graphicalProperties.solidFill = col
    pt.graphicalProperties.line.solidFill = 'FFFFFF'
    pie.series[0].dPt.append(pt)
pie.legend.position = 'r'
ws.add_chart(pie, 'E23')

# sample budget estimates so the dashboard is not empty on first open
est = {'Ceremony venue': 1500, 'Reception venue': 6000, 'Catering': 7500, 'Bar & alcohol': 1800, 'Photographer': 3200, 'Videographer': 1800, 'DJ / band': 1500, 'Florist': 2400, 'Wedding dress & alterations': 1800, 'Suit / tuxedo': 600, 'Hair & makeup': 600, 'Rings': 900, 'Stationery & postage': 500}
wsb = wb['Budget']
for rr in range(7, BUDGET_LAST + 1):
    v = wsb.cell(row=rr, column=1).value
    if v in est:
        wsb.cell(row=rr, column=3, value=est[v])
wsb['G7'] = 'Sample numbers: replace with your own'
wsb['G7'].font = Font(name=SANS, size=9, color=ACC, italic=True)

for w in wb.worksheets:
    w.sheet_view.zoomScale = 110
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist', 'The-Wedding-Planner_Spreadsheet.xlsx')
wb.save(out)
print('✓', out)

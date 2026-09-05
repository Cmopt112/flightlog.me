// One-off generator for the synthetic CSV test fixture. Not part of the shipped app.
import { writeFileSync } from 'node:fs'

const HEADER = [
  'Date', 'Flight ID', 'Model', 'ICAO Model', 'Tail Number', 'Display Tail', 'Aircraft ID',
  'Category/Class', 'Approaches', 'Hold', 'Landings', 'FS Night Landings', 'FS Day Landings',
  'X-Country', 'Night', 'IMC', 'Simulated Instrument', 'Ground Simulator', 'Dual Received', 'CFI',
  'SIC', 'PIC', 'Total Flight Time', 'CFI Time (HH:MM)', 'SIC Time (HH:MM)', 'PIC (HH:MM)',
  'Total Flight Time (HH:MM)', 'Route', 'Flight Properties', 'Comments', 'Hobbs Start', 'Hobbs End',
  'Engine Start', 'Engine End', 'Engine Time', 'Flight Start', 'Flight End', 'Flying Time', 'Complex',
  'Controllable pitch prop', 'Flaps', 'Retract', 'Tailwheel', 'High Performance', 'Turbine', 'TAA',
  'Signature State', 'Date of Signature', 'CFI Comment', 'CFI Certificate', 'CFI Name', 'CFI Email',
  'CFI Expiration', 'Public', 'Additional Crew Member(s)', 'Block In Time', 'Block Out Time',
  'Checkride - New Rating', 'External Line - Under 50ft', 'Simulator/Training Device Identifier',
  'Sling Load Carries',
]

const rows = [
  {
    Date: '2026-06-21', 'Flight ID': '90000001', Model: 'BH-412, Test', 'ICAO Model': 'B412',
    'Tail Number': 'EC-TST', 'Display Tail': 'EC-TST', 'Aircraft ID': '100001',
    'Category/Class': 'Helicopter', Approaches: '0', Landings: '2', 'FS Night Landings': '0',
    'FS Day Landings': '0', 'Dual Received': '0,83', 'Total Flight Time': '0,83',
    'Total Flight Time (HH:MM)': '0:50', Route: 'AAAA - BBBB',
    'Flight Properties': 'Block: 21.06.2026 13:40 to 21.06.2026 14:30 (0,83); Additional Crew: A. Example',
    'Hobbs Start': '0,00', 'Hobbs End': '0,00', Public: 'Yes',
    'Additional Crew Member(s)': 'A. Example', 'Block In Time': '2026-06-21 14:30:00Z',
    'Block Out Time': '2026-06-21 13:40:00Z', Turbine: 'Yes',
  },
  {
    Date: '2026-06-17', 'Flight ID': '90000002', Model: 'BH-412, Test', 'ICAO Model': 'B412',
    'Tail Number': 'EC-TST', 'Display Tail': 'EC-TST', 'Aircraft ID': '100001',
    'Category/Class': 'Helicopter', Approaches: '0', Landings: '2', 'FS Night Landings': '0',
    'FS Day Landings': '0', PIC: '2,0', 'Total Flight Time': '2,0',
    'PIC (HH:MM)': '2:00', 'Total Flight Time (HH:MM)': '2:00', Route: 'AAAA - BBBB',
    Comments: '3x Discharges Foam', 'Hobbs Start': '0,00', 'Hobbs End': '0,00', Public: 'Yes',
    'Additional Crew Member(s)': 'B. Example', 'External Line - Under 50ft': 'Yes', Turbine: 'Yes',
    'Sling Load Carries': '3',
  },
  {
    Date: '2026-05-20', 'Flight ID': '90000003', Model: 'BH-412, Test', 'ICAO Model': 'B412',
    'Tail Number': 'EC-TST2', 'Display Tail': 'EC-TST2', 'Aircraft ID': '100002',
    'Category/Class': 'Helicopter', Approaches: '0', Landings: '3', 'FS Night Landings': '0',
    'FS Day Landings': '0', SIC: '1,08', 'Total Flight Time': '1,08', 'SIC Time (HH:MM)': '1:05',
    'Total Flight Time (HH:MM)': '1:05', Route: 'CCCC - CCCC', 'Hobbs Start': '0,00',
    'Hobbs End': '0,00', Public: 'Yes', 'Additional Crew Member(s)': 'C. Instructor FI', Turbine: 'Yes',
  },
  {
    Date: '2026-05-14', 'Flight ID': '90000004', Model: 'BH-412, Test', 'ICAO Model': 'B412',
    'Tail Number': 'SIM000', 'Display Tail': 'SIM000', 'Aircraft ID': '100003',
    'Category/Class': 'Helicopter', Approaches: '0', Landings: '0', 'FS Night Landings': '0',
    'FS Day Landings': '0', PIC: '2,0', 'Total Flight Time': '2,0', 'PIC (HH:MM)': '2:00',
    'Total Flight Time (HH:MM)': '2:00', Comments: 'Type Rating Sim SP1', 'Hobbs Start': '0,00',
    'Hobbs End': '0,00', Public: 'Yes', 'Additional Crew Member(s)': 'C. Instructor FI',
    'Simulator/Training Device Identifier': 'ES-1H-000',
  },
  {
    Date: '2026-04-08', 'Flight ID': '90000005', Model: 'BH-412, Test', 'ICAO Model': 'B412',
    'Tail Number': 'SIM000', 'Display Tail': 'SIM000', 'Aircraft ID': '100003',
    'Category/Class': 'Helicopter', Approaches: '0', Landings: '0', 'FS Night Landings': '0',
    'FS Day Landings': '0', PIC: '1,5', 'Total Flight Time': '1,5', 'PIC (HH:MM)': '1:30',
    'Total Flight Time (HH:MM)': '1:30', Comments: 'Skill Test Practice\n 5x Approaches (paid already)',
    'Hobbs Start': '0,00', 'Hobbs End': '0,00', Public: 'Yes',
    'Additional Crew Member(s)': 'C. Instructor FI', 'Simulator/Training Device Identifier': 'ES-2H-000',
  },
  {
    Date: '2025-11-24', 'Flight ID': '90000006', Model: 'R-22, Test Robinson', 'ICAO Model': 'R22',
    'Tail Number': 'OE-TST', 'Display Tail': 'OE-TST', 'Aircraft ID': '100004',
    'Category/Class': 'Helicopter (R22)', Approaches: '0', Landings: '1', 'FS Night Landings': '0',
    'FS Day Landings': '0', PIC: '1,2', 'Total Flight Time': '1,2', 'PIC (HH:MM)': '1:12',
    'Total Flight Time (HH:MM)': '1:12', Route: 'AAAA  BBBB', // legacy double-space separator, no dashes
    'Hobbs Start': '0,00', 'Hobbs End': '0,00', 'Engine Start': '2025-11-24 11:40:00Z',
    'Engine End': '2025-11-24 12:52:00Z', 'Engine Time': '1,2', 'Flight Start': '2025-11-24 11:42:00Z',
    'Flight End': '2025-11-24 12:50:00Z', 'Flying Time': '1,13', Public: 'Yes',
  },
  {
    Date: '2025-10-24', 'Flight ID': '90000007', Model: 'R-22, Test Robinson', 'ICAO Model': 'R22',
    'Tail Number': 'OE-TST2', 'Display Tail': 'OE-TST2', 'Aircraft ID': '100005',
    'Category/Class': 'Helicopter (R22)', Approaches: '0', Landings: '1', 'FS Night Landings': '0',
    'FS Day Landings': '0', 'Dual Received': '1,65', 'Total Flight Time': '1,65',
    'Total Flight Time (HH:MM)': '1:39', Route: 'BBBB  AAAA',
    'Additional Crew Member(s)': 'D. Instructor FI', 'Hobbs Start': '0,00', 'Hobbs End': '0,00',
    Public: 'Yes',
  },
]

function escapeField(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

const lines = [HEADER.map(escapeField).join(';')]
for (const row of rows) {
  lines.push(HEADER.map((h) => escapeField(row[h] ?? '')).join(';'))
}

const BOM = '﻿'
writeFileSync(
  'src/features/import-export/__fixtures__/myflightbook-sample.csv',
  BOM + lines.join('\r\n') + '\r\n',
  'utf-8',
)
console.log(`Wrote ${rows.length} synthetic flights.`)

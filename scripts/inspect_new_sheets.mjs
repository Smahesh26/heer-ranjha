import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const files = [
  'new/Collection- Asaya Corrected Sheet.xlsx',
  'new/NAYI LEHER Corrected sheet for WEBSITE (Autosaved).xlsx',
  'new/Roomani collection detailed sheet (Autosaved).xlsx'
];

files.forEach(f => {
  const fullPath = path.resolve(f);
  console.log(`\n========================================`);
  console.log(`FILE: ${f}`);
  if (!fs.existsSync(fullPath)) {
    console.log(`File does not exist: ${fullPath}`);
    return;
  }

  const wb = xlsx.readFile(fullPath, { cellStyles: false, cellFormulas: false, cellDates: false });
  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} (total raw rows: ${rawRows.length}) ---`);
    if (rawRows.length > 0) {
      console.log('First 5 raw rows:');
      rawRows.slice(0, 5).forEach((r, idx) => {
        console.log(`Row ${idx}:`, JSON.stringify(r));
      });
    }
  });
});

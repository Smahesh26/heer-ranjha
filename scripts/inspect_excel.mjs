import xlsx from 'xlsx';

const files = [
  'Collection- Asaya Detailed Sheet.xlsx',
  'NAYI LEHER WEBSITE.xlsx'
];

for (const file of files) {
  try {
    const workbook = xlsx.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`\n=== Headers for ${file} ===`);
    // Print first 5 rows to see structure
    for (let i = 0; i < Math.min(5, rows.length); i++) {
        console.log(`Row ${i}:`, rows[i]);
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
}

import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-');    // Replace multiple - with single -
}

async function main() {
  const workbook = xlsx.readFile('Website Portfolio Structure and Data (1).xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Read data starting from header row
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Find the header row index (where 'S.no' is first cell)
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'S.no') {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error("Could not find header row");
    return;
  }

  const headers = rows[headerIndex];
  const dataRows = rows.slice(headerIndex + 1);

  for (const row of dataRows) {
    if (!row[0]) continue; // Skip empty rows or rows without S.no

    // Map row to headers
    const item = {};
    for (let i = 0; i < headers.length; i++) {
      item[headers[i]] = row[i] || '';
    }

    const name = item['Product Name']?.toString().trim();
    if (!name) continue;

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    // ensure slug is unique
    while (true) {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = item['Product Category']?.toString().trim() || 'Uncategorized';
    const subCategory = item['Product Sub Category (if any)']?.toString().trim() || 'Default';
    
    // Some inference for collection and fabric from the data
    const collection = item['D.No Bottom']?.toString().trim() || 'Nayi Leher';
    
    let fabric = 'Mixed';
    if (name.toLowerCase().includes('matka')) fabric = 'Matka';
    else if (name.toLowerCase().includes('cotton')) fabric = 'Cotton';
    else if (name.toLowerCase().includes('dupion')) fabric = 'Dupion';

    const description = item['Product Highlights']?.toString().trim() || 'Beautiful handcrafted piece.';

    try {
      await prisma.product.create({
        data: {
          name,
          slug,
          description,
          category,
          subCategory,
          collection,
          fabric,
          price: 0,
          mrp: 0,
          stock: 10,
          images: '[]',
          sizeOptions: JSON.stringify(["S", "M", "L", "XL"]),
          sizeCharges: '{}',
          active: true,
          featured: false
        }
      });
      console.log(`Created product: ${name}`);
    } catch (err) {
      console.error(`Failed to create product: ${name}`, err.message);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

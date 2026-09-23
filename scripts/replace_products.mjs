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

function extractNumber(str) {
  if (!str) return 0;
  const num = parseInt(str.toString().replace(/\D/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

async function importFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === 'S.NO') {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error(`Could not find header row in ${filePath}`);
    return;
  }

  const headers = rows[headerIndex];
  const dataRows = rows.slice(headerIndex + 1);

  for (const row of dataRows) {
    // If the row doesn't have an S.NO or Product Name, skip it
    if (!row[0] || isNaN(parseInt(row[0]))) continue;

    const item = {};
    for (let i = 0; i < headers.length; i++) {
      if (headers[i]) {
        if (headers[i] === 'Image URLs (comma separated)') {
            if (!item.images) item.images = [];
            if (row[i]) {
              const urls = row[i].toString().split(',').map(s => s.trim()).filter(Boolean);
              item.images.push(...urls);
            }
        } else {
            item[headers[i].trim()] = row[i];
        }
      }
    }

    const name = item['Product Name']?.toString().trim();
    if (!name) continue;

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = item['Product Category']?.toString().trim() || 'Uncategorized';
    const subCategory = item['Product Sub Category']?.toString().trim() || 'Default';
    const collection = item['Collection']?.toString().trim() || 'Uncategorized';
    const fabric = item['Fabric']?.toString().trim() || 'Mixed';
    const description = item['Product Highlights (Description)']?.toString().trim() || '';
    
    const price = extractNumber(item['Price']);
    const mrp = extractNumber(item['MRP']);
    
    // MTO defaults to a virtual stock
    const stock = 10;
    
    const imagesStr = item.images && item.images.length > 0 ? JSON.stringify(item.images) : '[]';

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
          price,
          mrp,
          stock,
          images: imagesStr,
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

async function main() {
  console.log("Deleting all existing products...");
  await prisma.product.deleteMany({});
  console.log("All existing products deleted.");

  console.log("Importing Asaya Collection...");
  await importFile('Collection- Asaya Detailed Sheet.xlsx');
  
  console.log("Importing Nayi Leher Collection...");
  await importFile('NAYI LEHER WEBSITE.xlsx');
  
  console.log("Import completed!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

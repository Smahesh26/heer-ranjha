const AdmZip = require('adm-zip');
const fs = require('fs');

const zip = new AdmZip('Website Portfolio Structure and Data (1).xlsx');
const zipEntries = zip.getEntries();

let count = 0;
zipEntries.forEach(function(zipEntry) {
    if (zipEntry.entryName.startsWith('xl/media/')) {
        console.log(zipEntry.entryName);
        count++;
    }
});

console.log(`Total images found: ${count}`);

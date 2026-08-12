const fs = require('fs');
const https = require('https');

const fileId = '1JfUlZogX0_fJDmsI9D-k99CelUERWM8E';
const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

https.get(url, (res) => {
  if (res.statusCode === 302 || res.statusCode === 303) {
    console.log("Redirected to:", res.headers.location);
    https.get(res.headers.location, (res2) => {
      const file = fs.createWriteStream('test_image.jpg');
      res2.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download completed');
      });
    }).on('error', (err) => {
      console.error('Error on redirect:', err.message);
    });
  } else {
    const file = fs.createWriteStream('test_image.jpg');
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download completed');
    });
  }
}).on('error', (err) => {
  console.error('Error:', err.message);
});

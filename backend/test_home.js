const http = require('http');
const fs = require('fs');
const results = {};

function fetch(label, url) {
  return new Promise((resolve) => {
    http.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { results[label] = JSON.parse(data); resolve(); });
    }).on('error', e => { results[label] = { error: e.message }; resolve(); });
  });
}

(async () => {
  await fetch('LIST', 'http://localhost:5000/api/public/home/membership-plans?page=1&limit=10');
  await fetch('DETAIL_ID2', 'http://localhost:5000/api/public/home/membership-plans/2');
  await fetch('DETAIL_404', 'http://localhost:5000/api/public/home/membership-plans/9999');
  fs.writeFileSync('test_home_plans.json', JSON.stringify(results, null, 2));
  console.log('DONE');
  process.exit(0);
})();

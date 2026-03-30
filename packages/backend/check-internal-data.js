const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);

console.log('📊 Checking product_internals data...\n');

try {
  const rows = db.prepare('SELECT * FROM product_internals').all();

  if (rows.length === 0) {
    console.log('⚠️  No data found in product_internals table');
  } else {
    console.log(`Found ${rows.length} record(s):\n`);
    rows.forEach((row, index) => {
      console.log(`Record ${index + 1}:`);
      console.log('  Product ID:', row.product_id);
      console.log('  Price Retail:', row.price_retail);
      console.log('  Price Wholesale:', row.price_wholesale);
      console.log('  Price Dealer:', row.price_dealer);
      console.log('  Price Promo:', row.price_promo);
      console.log('  Warehouse Location:', row.warehouse_location);
      console.log('  Stock Status:', row.stock_status);
      console.log('  Stock Quantity:', row.stock_quantity);
      console.log('  Supplier Name:', row.supplier_name);
      console.log('  Supplier Phone:', row.supplier_phone);
      console.log('  Internal Notes:', row.internal_notes);
      console.log('');
    });
  }
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);

console.log('🔧 Updating product_internals table...');

try {
  // Check if columns already exist
  const tableInfo = db.pragma('table_info(product_internals)');
  const existingColumns = tableInfo.map((col) => col.name);

  const newColumns = [
    { name: 'price_retail', type: 'REAL' },
    { name: 'price_wholesale', type: 'REAL' },
    { name: 'wholesale_discount_tiers', type: 'TEXT' },
    { name: 'price_dealer', type: 'REAL' },
    { name: 'price_promo', type: 'REAL' },
    { name: 'promo_start_date', type: 'TEXT' },
    { name: 'promo_end_date', type: 'TEXT' },
    { name: 'promo_note', type: 'TEXT' },
    { name: 'warehouse_location', type: 'TEXT' },
    { name: 'stock_status', type: 'TEXT' },
    { name: 'stock_quantity', type: 'INTEGER' },
    { name: 'supplier_phone', type: 'TEXT' },
  ];

  for (const col of newColumns) {
    if (!existingColumns.includes(col.name)) {
      console.log(`  Adding column: ${col.name}`);
      db.exec(
        `ALTER TABLE product_internals ADD COLUMN ${col.name} ${col.type}`,
      );
    } else {
      console.log(`  ✓ Column ${col.name} already exists`);
    }
  }

  console.log('✅ Database updated successfully!');
  console.log('\nUpdated columns:');
  const updatedInfo = db.pragma('table_info(product_internals)');
  updatedInfo.forEach((col) => {
    console.log(`  - ${col.name} (${col.type})`);
  });
} catch (error) {
  console.error('❌ Error updating database:', error.message);
  process.exit(1);
} finally {
  db.close();
}

const fs = require('fs');
const path = require('path');

const PRODUCTION_API =
  process.env.PRODUCTION_API_URL ||
  'https://phucuongthinh-production.up.railway.app/api/v1';
const OUTPUT_DIR = path.join(__dirname, '../data-backup');

async function fetchAll(endpoint) {
  try {
    const response = await fetch(`${PRODUCTION_API}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error.message);
    return [];
  }
}

async function fetchAllProducts() {
  const allProducts = [];
  let page = 1;

  while (true) {
    try {
      const response = await fetch(
        `${PRODUCTION_API}/products?page=${page}&limit=50&published=all`,
      );
      if (!response.ok) break;

      const data = await response.json();
      const products = data.data || [];

      if (products.length === 0) break;

      allProducts.push(...products);
      console.log(`   Fetched page ${page} (${products.length} products)`);

      page++;

      if (!data.pagination || page > data.pagination.total_pages) break;
    } catch (error) {
      console.error(`❌ Error fetching products page ${page}:`, error.message);
      break;
    }
  }

  return allProducts;
}

async function main() {
  console.log('🚀 Exporting production data...');
  console.log(`📡 API: ${PRODUCTION_API}\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  try {
    // Export categories
    console.log('📦 Exporting categories...');
    const categories = await fetchAll('/categories');
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `categories-${timestamp}.json`),
      JSON.stringify(categories, null, 2),
    );
    console.log(`✅ Exported ${categories.length} categories\n`);

    // Export styles
    console.log('🎨 Exporting styles...');
    const styles = await fetchAll('/styles');
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `styles-${timestamp}.json`),
      JSON.stringify(styles, null, 2),
    );
    console.log(`✅ Exported ${styles.length} styles\n`);

    // Export spaces
    console.log('🏠 Exporting spaces...');
    const spaces = await fetchAll('/spaces');
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `spaces-${timestamp}.json`),
      JSON.stringify(spaces, null, 2),
    );
    console.log(`✅ Exported ${spaces.length} spaces\n`);

    // Export products
    console.log('📦 Exporting products...');
    const products = await fetchAllProducts();
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `products-${timestamp}.json`),
      JSON.stringify(products, null, 2),
    );
    console.log(`✅ Exported ${products.length} products\n`);

    // Create a combined export
    const fullExport = {
      exported_at: new Date().toISOString(),
      source: PRODUCTION_API,
      categories,
      styles,
      spaces,
      products,
    };

    const fullExportPath = path.join(
      OUTPUT_DIR,
      `full-export-${timestamp}.json`,
    );
    fs.writeFileSync(fullExportPath, JSON.stringify(fullExport, null, 2));

    console.log('✨ Export completed!');
    console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
    console.log(`📄 Full export: ${fullExportPath}`);

    return fullExportPath;
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

main();

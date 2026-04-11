/**
 * Fix production PostgreSQL: chuyển "Đậm" từ Gạch lát nền → Gạch ốp tường
 */
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('✅ Kết nối production DB thành công');

  // Tìm tất cả "Đậm"
  const { rows: damRows } = await client.query(
    `SELECT c.id, c.name, c.slug, c.parent_id, p.name as parent_name, p.slug as parent_slug
     FROM categories c
     LEFT JOIN categories p ON c.parent_id = p.id
     WHERE c.name = 'Đậm'`,
  );

  console.log('\n📋 Tất cả danh mục "Đậm" hiện tại:');
  damRows.forEach((r) =>
    console.log(
      `  - id: ${r.id}, slug: ${r.slug}, parent: ${r.parent_name} (${r.parent_slug})`,
    ),
  );

  // Tìm gạch ốp tường
  const { rows: wallRows } = await client.query(
    `SELECT id, name FROM categories WHERE slug = 'gach-op-tuong'`,
  );
  if (!wallRows.length) {
    console.error('❌ Không tìm thấy gach-op-tuong');
    return;
  }
  const wallId = wallRows[0].id;
  console.log(`\n✅ Gạch ốp tường id: ${wallId}`);

  // Tìm gạch lát nền
  const { rows: floorRows } = await client.query(
    `SELECT id, name FROM categories WHERE slug = 'gach-lat-nen'`,
  );
  if (!floorRows.length) {
    console.error('❌ Không tìm thấy gach-lat-nen');
    return;
  }
  const floorId = floorRows[0].id;

  // Tìm "Đậm" dưới gạch lát nền
  const damUnderFloor = damRows.filter((r) => r.parent_id === floorId);

  if (!damUnderFloor.length) {
    console.log('\nℹ️  Không có "Đậm" nào dưới Gạch lát nền.');
  } else {
    for (const dam of damUnderFloor) {
      // Kiểm tra đã có "Đậm" dưới gạch ốp tường chưa
      const damUnderWall = damRows.find((r) => r.parent_id === wallId);
      if (damUnderWall) {
        console.log(
          `\n⚠️  "Đậm" đã tồn tại dưới Gạch ốp tường (id: ${damUnderWall.id})`,
        );
        console.log(`🗑️  Xóa bản trùng dưới Gạch lát nền (id: ${dam.id})...`);
        await client.query(`DELETE FROM categories WHERE id = $1`, [dam.id]);
        console.log('✅ Đã xóa.');
      } else {
        console.log(`\n🔄 Chuyển "Đậm" (id: ${dam.id}) sang Gạch ốp tường...`);
        await client.query(
          `UPDATE categories SET parent_id = $1, slug = 'dam', updated_at = NOW() WHERE id = $2`,
          [wallId, dam.id],
        );
        console.log('✅ Đã chuyển.');
      }
    }
  }

  // Kết quả sau fix
  console.log('\n📋 Danh mục con của Gạch ốp tường sau fix:');
  const { rows: wallChildren } = await client.query(
    `SELECT name, slug FROM categories WHERE parent_id = $1 ORDER BY name`,
    [wallId],
  );
  wallChildren.forEach((r) => console.log(`  - ${r.name} (${r.slug})`));

  console.log('\n📋 Danh mục con của Gạch lát nền sau fix:');
  const { rows: floorChildren } = await client.query(
    `SELECT name, slug FROM categories WHERE parent_id = $1 ORDER BY name`,
    [floorId],
  );
  floorChildren.forEach((r) => console.log(`  - ${r.name} (${r.slug})`));
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  })
  .finally(() => client.end());

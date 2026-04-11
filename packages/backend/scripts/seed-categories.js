const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

const CATEGORIES = [
  {
    name: 'Gạch ốp lát',
    slug: 'gach-op-lat',
    children: [
      {
        name: 'Gạch lát nền',
        slug: 'gach-lat-nen',
        children: [
          {
            name: 'Porcelain bóng trắng trơn',
            slug: 'porcelain-bong-trang-tron',
          },
          { name: 'Porcelain bóng xám', slug: 'porcelain-bong-xam' },
          { name: 'Porcelain bóng vân đá', slug: 'porcelain-bong-van-da' },
          { name: 'Porcelain bóng giả gỗ', slug: 'porcelain-bong-gia-go' },
        ],
      },
      {
        name: 'Gạch ốp tường',
        slug: 'gach-op-tuong',
        children: [
          {
            name: 'Ceramic / Porcelain bóng vân đá',
            slug: 'ceramic-bong-van-da',
          },
          {
            name: 'Ceramic / Porcelain mờ vân gạch',
            slug: 'ceramic-mo-van-gach',
          },
          { name: 'Ceramic / Porcelain 3D', slug: 'ceramic-3d' },
          { name: 'Đậm', slug: 'dam' },
        ],
      },
      {
        name: 'Gạch trang trí',
        slug: 'gach-trang-tri',
        children: [
          { name: 'Mosaic', slug: 'mosaic' },
          { name: 'Gạch thẻ', slug: 'gach-the' },
          { name: 'Gạch điểm nhấn', slug: 'gach-diem-nhan' },
        ],
      },
    ],
  },
  {
    name: 'Ngói & Vật liệu mái',
    slug: 'ngoi-vat-lieu-mai',
    children: [
      {
        name: 'Ngói lợp',
        slug: 'ngoi-lop',
        children: [
          { name: 'Ngói đất nung', slug: 'ngoi-dat-nung' },
          { name: 'Ngói xi măng', slug: 'ngoi-xi-mang' },
        ],
      },
      {
        name: 'Phụ kiện mái',
        slug: 'phu-kien-mai',
        children: [
          { name: 'Rìa mái', slug: 'ria-mai' },
          { name: 'Úp nóc', slug: 'up-noc' },
          { name: 'Phụ kiện chống dột', slug: 'phu-kien-chong-dot' },
        ],
      },
    ],
  },
  {
    name: 'Thiết bị phòng tắm',
    slug: 'thiet-bi-phong-tam',
    children: [
      { name: 'Bồn cầu', slug: 'bon-cau' },
      { name: 'Lavabo', slug: 'lavabo' },
      { name: 'Sen tắm', slug: 'sen-tam' },
      { name: 'Bồn tắm', slug: 'bon-tam' },
      { name: 'Gương phòng tắm', slug: 'guong-phong-tam' },
      { name: 'Tủ lavabo', slug: 'tu-lavabo' },
    ],
  },
  {
    name: 'Thiết bị nhà bếp',
    slug: 'thiet-bi-nha-bep',
    children: [
      { name: 'Chậu rửa', slug: 'chau-rua' },
      { name: 'Vòi rửa', slug: 'voi-rua' },
      { name: 'Bếp gas / điện / từ', slug: 'bep' },
      { name: 'Máy hút mùi', slug: 'may-hut-mui' },
    ],
  },
  {
    name: 'Phụ kiện & Vật tư',
    slug: 'phu-kien-vat-tu',
    children: [
      { name: 'Keo dán gạch', slug: 'keo-dan-gach' },
      { name: 'Keo chà ron', slug: 'keo-cha-ron' },
      { name: 'Nẹp inox / nhựa', slug: 'nep-inox-nhua' },
      { name: 'Phễu thoát sàn', slug: 'pheu-thoat-san' },
      { name: 'Chống thấm', slug: 'chong-tham' },
    ],
  },
  { name: 'Trang trí nội thất', slug: 'trang-tri-noi-that', children: [] },
  { name: 'Thiết bị điện – nước', slug: 'thiet-bi-dien-nuoc', children: [] },
];

function cuid() {
  return (
    'c' +
    Math.random().toString(36).slice(2, 15) +
    Math.random().toString(36).slice(2, 15)
  );
}

async function upsert(name, slug, parentId) {
  const id = cuid();
  const now = new Date().toISOString();
  await client.query(
    `INSERT INTO categories (id, name, slug, parent_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$5)
     ON CONFLICT (slug) DO UPDATE SET name=$2, parent_id=$4, updated_at=$5`,
    [id, name, slug, parentId, now],
  );
  const { rows } = await client.query(
    'SELECT id FROM categories WHERE slug=$1',
    [slug],
  );
  return rows[0].id;
}

async function main() {
  await client.connect();
  for (const root of CATEGORIES) {
    const rootId = await upsert(root.name, root.slug, null);
    console.log(`✅ ${root.name}`);
    for (const child of root.children || []) {
      const childId = await upsert(child.name, child.slug, rootId);
      console.log(`  ✅ ${child.name}`);
      for (const grand of child.children || []) {
        await upsert(grand.name, grand.slug, childId);
        console.log(`    ✅ ${grand.name}`);
      }
    }
  }
  console.log('\nDone!');
  await client.end();
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});

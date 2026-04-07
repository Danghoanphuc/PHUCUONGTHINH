const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Thêm danh mục con cho Gạch Ốp Tường...');

  // Tìm danh mục Gạch Ốp Tường
  const wallTilesCategory = await prisma.category.findFirst({
    where: {
      slug: 'gach-op-tuong',
    },
  });

  if (!wallTilesCategory) {
    console.error('❌ Không tìm thấy danh mục Gạch Ốp Tường');
    return;
  }

  console.log(
    `✅ Tìm thấy danh mục: ${wallTilesCategory.name} (${wallTilesCategory.id})`,
  );

  // Danh sách danh mục con cần thêm
  const subcategories = [
    { name: 'Điểm', slug: 'diem' },
    { name: 'Thân', slug: 'than' },
    { name: 'Viền', slug: 'vien' },
    { name: 'Nhạt', slug: 'nhat' },
    { name: 'Đậm', slug: 'dam' },
  ];

  for (const subcat of subcategories) {
    const existing = await prisma.category.findFirst({
      where: {
        slug: subcat.slug,
        parent_id: wallTilesCategory.id,
      },
    });

    if (existing) {
      console.log(`⏭️  Danh mục "${subcat.name}" đã tồn tại, bỏ qua`);
      continue;
    }

    const created = await prisma.category.create({
      data: {
        name: subcat.name,
        slug: subcat.slug,
        parent_id: wallTilesCategory.id,
      },
    });

    console.log(`✅ Đã tạo danh mục con: ${created.name} (${created.id})`);
  }

  console.log('🎉 Hoàn thành!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

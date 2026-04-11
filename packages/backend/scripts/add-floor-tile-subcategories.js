const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Thêm danh mục con cho Gạch Lát Nền...');

  const floorTilesCategory = await prisma.category.findFirst({
    where: { slug: 'gach-lat-nen' },
  });

  if (!floorTilesCategory) {
    console.error('❌ Không tìm thấy danh mục Gạch Lát Nền');
    return;
  }

  console.log(
    `✅ Tìm thấy danh mục: ${floorTilesCategory.name} (${floorTilesCategory.id})`,
  );

  const subcategories = []; // 'Đậm' đã được chuyển sang Gạch ốp tường

  for (const subcat of subcategories) {
    const existing = await prisma.category.findFirst({
      where: { slug: subcat.slug, parent_id: floorTilesCategory.id },
    });

    if (existing) {
      console.log(`⏭️  Danh mục "${subcat.name}" đã tồn tại, bỏ qua`);
      continue;
    }

    const created = await prisma.category.create({
      data: {
        name: subcat.name,
        slug: subcat.slug,
        parent_id: floorTilesCategory.id,
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

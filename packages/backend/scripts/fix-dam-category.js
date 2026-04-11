/**
 * Script: Chuyển danh mục "Đậm" từ Gạch lát nền → Gạch ốp tường
 * Chạy: node packages/backend/scripts/fix-dam-category.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wallTiles = await prisma.category.findFirst({
    where: { slug: 'gach-op-tuong' },
  });
  if (!wallTiles) {
    console.error('❌ Không tìm thấy danh mục Gạch ốp tường');
    return;
  }

  const floorTiles = await prisma.category.findFirst({
    where: { slug: 'gach-lat-nen' },
  });
  if (!floorTiles) {
    console.error('❌ Không tìm thấy danh mục Gạch lát nền');
    return;
  }

  // Tìm "Đậm" đang nằm dưới gạch lát nền (slug dam-lat-nen hoặc dam)
  const damUnderFloor = await prisma.category.findFirst({
    where: {
      name: 'Đậm',
      parent_id: floorTiles.id,
    },
  });

  if (!damUnderFloor) {
    console.log(
      'ℹ️  Không tìm thấy "Đậm" dưới Gạch lát nền — có thể đã được sửa rồi.',
    );
  } else {
    // Kiểm tra xem "Đậm" đã tồn tại dưới gạch ốp tường chưa
    const damUnderWall = await prisma.category.findFirst({
      where: { name: 'Đậm', parent_id: wallTiles.id },
    });

    if (damUnderWall) {
      // Đã có "Đậm" dưới gạch ốp tường → xóa bản trùng dưới gạch lát nền
      console.log(
        `⚠️  "Đậm" đã tồn tại dưới Gạch ốp tường (id: ${damUnderWall.id})`,
      );
      console.log(
        `🗑️  Xóa bản trùng dưới Gạch lát nền (id: ${damUnderFloor.id})...`,
      );
      await prisma.category.delete({ where: { id: damUnderFloor.id } });
      console.log('✅ Đã xóa bản trùng.');
    } else {
      // Chuyển "Đậm" sang gạch ốp tường, đổi slug thành 'dam'
      await prisma.category.update({
        where: { id: damUnderFloor.id },
        data: { parent_id: wallTiles.id, slug: 'dam' },
      });
      console.log(
        `✅ Đã chuyển "Đậm" (id: ${damUnderFloor.id}) sang Gạch ốp tường.`,
      );
    }
  }

  console.log('\n📋 Danh mục con hiện tại của Gạch ốp tường:');
  const wallChildren = await prisma.category.findMany({
    where: { parent_id: wallTiles.id },
    orderBy: { name: 'asc' },
  });
  wallChildren.forEach((c) => console.log(`  - ${c.name} (${c.slug})`));

  console.log('\n📋 Danh mục con hiện tại của Gạch lát nền:');
  const floorChildren = await prisma.category.findMany({
    where: { parent_id: floorTiles.id },
    orderBy: { name: 'asc' },
  });
  floorChildren.forEach((c) => console.log(`  - ${c.name} (${c.slug})`));
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

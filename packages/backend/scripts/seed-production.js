const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Checking production database...');

  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log(
      `✅ Database already has ${existingProducts} products. Skipping seed.`,
    );
    return;
  }

  console.log('🌱 Seeding production database...');

  const hashedPassword = await bcrypt.hash('admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@phucuongthinh.net' },
    update: {},
    create: {
      email: 'admin@phucuongthinh.net',
      password_hash: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  const tilesCategory = await prisma.category.upsert({
    where: { slug: 'gach' },
    update: {},
    create: { name: 'Gạch', slug: 'gach' },
  });

  const floorTilesCategory = await prisma.category.upsert({
    where: { slug: 'gach-lat-nen' },
    update: {},
    create: {
      name: 'Gạch Lát Nền',
      slug: 'gach-lat-nen',
      parent_id: tilesCategory.id,
    },
  });

  const wallTilesCategory = await prisma.category.upsert({
    where: { slug: 'gach-op-tuong' },
    update: {},
    create: {
      name: 'Gạch Ốp Tường',
      slug: 'gach-op-tuong',
      parent_id: tilesCategory.id,
    },
  });

  console.log('✅ Created categories');

  const styles = ['Hiện đại', 'Tối giản', 'Công nghiệp', 'Cổ điển'];
  for (const styleName of styles) {
    await prisma.style.upsert({
      where: { name: styleName },
      update: {},
      create: { name: styleName },
    });
  }
  console.log('✅ Created styles');

  const spaces = ['Phòng Khách', 'Phòng Ngủ', 'Nhà Bếp', 'Phòng Tắm'];
  for (const spaceName of spaces) {
    await prisma.space.upsert({
      where: { name: spaceName },
      update: {},
      create: { name: spaceName },
    });
  }
  console.log('✅ Created spaces');

  const products = [
    {
      name: 'Gạch Porcelain Lát Nền 60x60 - Trắng Sáng',
      sku: 'GACH-FLOOR-001',
      description:
        'Gạch porcelain cao cấp với bề mặt bóng sang trọng, độ bền vượt trội.',
      category_id: floorTilesCategory.id,
      technical_specs: {
        kich_thuoc: '600x600x10mm',
        chat_lieu: 'Porcelain',
        xuat_xu: 'VN',
      },
    },
    {
      name: 'Gạch Porcelain Giả Gỗ 80x20 - Nâu Ấm',
      sku: 'GACH-FLOOR-002',
      description: 'Gạch giả gỗ tự nhiên, ấm cúng, chống trơn tốt.',
      category_id: floorTilesCategory.id,
      technical_specs: {
        kich_thuoc: '800x200x10mm',
        chat_lieu: 'Porcelain',
        xuat_xu: 'VN',
      },
    },
    {
      name: 'Gạch Ốp Tường 30x60 - Trắng',
      sku: 'GACH-WALL-001',
      description: 'Gạch ốp tường phòng tắm, chống ẩm mốc.',
      category_id: wallTilesCategory.id,
      technical_specs: {
        kich_thuoc: '300x600x8mm',
        chat_lieu: 'Ceramic',
        xuat_xu: 'VN',
      },
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        ...p,
        technical_specs: JSON.stringify(p.technical_specs),
        is_published: true,
      },
    });
  }

  console.log(`✅ Created ${products.length} products`);
  console.log('🎉 Seeding completed!');
  console.log('📝 Admin: admin@phucuongthinh.net / admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

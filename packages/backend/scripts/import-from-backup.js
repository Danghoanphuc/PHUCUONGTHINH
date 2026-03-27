const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData(backupFile) {
  console.log(`📥 Importing from ${backupFile}...\n`);

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ File not found: ${backupFile}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  try {
    // Import categories
    if (data.categories) {
      console.log('📦 Importing categories...');
      for (const cat of data.categories) {
        await prisma.category.upsert({
          where: { id: cat.id },
          update: {
            name: cat.name,
            slug: cat.slug,
            parent_id: cat.parent_id,
          },
          create: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            parent_id: cat.parent_id,
          },
        });
      }
      console.log(`✅ Imported ${data.categories.length} categories\n`);
    }

    // Import styles
    if (data.styles) {
      console.log('🎨 Importing styles...');
      for (const style of data.styles) {
        await prisma.style.upsert({
          where: { id: style.id },
          update: { name: style.name },
          create: {
            id: style.id,
            name: style.name,
          },
        });
      }
      console.log(`✅ Imported ${data.styles.length} styles\n`);
    }

    // Import spaces
    if (data.spaces) {
      console.log('🏠 Importing spaces...');
      for (const space of data.spaces) {
        await prisma.space.upsert({
          where: { id: space.id },
          update: { name: space.name },
          create: {
            id: space.id,
            name: space.name,
          },
        });
      }
      console.log(`✅ Imported ${data.spaces.length} spaces\n`);
    }

    // Import products
    if (data.products) {
      console.log('📦 Importing products...');
      let count = 0;

      for (const product of data.products) {
        try {
          // Upsert product
          await prisma.product.upsert({
            where: { id: product.id },
            update: {
              name: product.name,
              sku: product.sku,
              description: product.description,
              category_id: product.category_id,
              technical_specs:
                typeof product.technical_specs === 'string'
                  ? product.technical_specs
                  : JSON.stringify(product.technical_specs),
              is_published: product.is_published,
            },
            create: {
              id: product.id,
              name: product.name,
              sku: product.sku,
              description: product.description,
              category_id: product.category_id,
              technical_specs:
                typeof product.technical_specs === 'string'
                  ? product.technical_specs
                  : JSON.stringify(product.technical_specs),
              is_published: product.is_published,
            },
          });

          // Import media
          if (product.media && product.media.length > 0) {
            await prisma.media.deleteMany({
              where: { product_id: product.id },
            });

            for (const media of product.media) {
              await prisma.media.create({
                data: {
                  id: media.id,
                  product_id: product.id,
                  file_url: media.file_url,
                  file_type: media.file_type,
                  media_type: media.media_type,
                  sort_order: media.sort_order,
                  is_cover: media.is_cover,
                  file_size: media.file_size,
                  alt_text: media.alt_text,
                },
              });
            }
          }

          // Import style tags
          if (product.style_tags && product.style_tags.length > 0) {
            await prisma.productStyleTag.deleteMany({
              where: { product_id: product.id },
            });

            for (const tag of product.style_tags) {
              await prisma.productStyleTag.create({
                data: {
                  product_id: product.id,
                  style_id: tag.style_id,
                },
              });
            }
          }

          // Import space tags
          if (product.space_tags && product.space_tags.length > 0) {
            await prisma.productSpaceTag.deleteMany({
              where: { product_id: product.id },
            });

            for (const tag of product.space_tags) {
              await prisma.productSpaceTag.create({
                data: {
                  product_id: product.id,
                  space_id: tag.space_id,
                },
              });
            }
          }

          count++;
          process.stdout.write(
            `\r   Imported ${count}/${data.products.length} products...`,
          );
        } catch (error) {
          console.error(
            `\n❌ Error importing product ${product.sku}:`,
            error.message,
          );
        }
      }

      console.log(`\n✅ Imported ${count} products\n`);
    }

    console.log('✨ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

async function main() {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.error('❌ Please provide backup file path');
    console.log(
      '💡 Usage: node scripts/import-from-backup.js <backup-file.json>',
    );
    console.log(
      '   Example: node scripts/import-from-backup.js data-backup/full-export-2026-03-27.json',
    );
    process.exit(1);
  }

  try {
    await importData(backupFile);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

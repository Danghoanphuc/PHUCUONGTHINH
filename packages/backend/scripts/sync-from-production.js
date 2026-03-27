const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Production API URL
const PRODUCTION_API =
  process.env.PRODUCTION_API_URL || 'https://your-production-url.com/api/v1';

const prisma = new PrismaClient();

async function fetchFromProduction(endpoint) {
  try {
    const response = await axios.get(`${PRODUCTION_API}${endpoint}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

async function syncCategories() {
  console.log('📦 Syncing categories...');
  const categories = await fetchFromProduction('/categories');

  if (!categories) return;

  for (const cat of categories) {
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

  console.log(`✅ Synced ${categories.length} categories`);
}

async function syncStyles() {
  console.log('🎨 Syncing styles...');
  const styles = await fetchFromProduction('/styles');

  if (!styles) return;

  for (const style of styles) {
    await prisma.style.upsert({
      where: { id: style.id },
      update: { name: style.name },
      create: {
        id: style.id,
        name: style.name,
      },
    });
  }

  console.log(`✅ Synced ${styles.length} styles`);
}

async function syncSpaces() {
  console.log('🏠 Syncing spaces...');
  const spaces = await fetchFromProduction('/spaces');

  if (!spaces) return;

  for (const space of spaces) {
    await prisma.space.upsert({
      where: { id: space.id },
      update: { name: space.name },
      create: {
        id: space.id,
        name: space.name,
      },
    });
  }

  console.log(`✅ Synced ${spaces.length} spaces`);
}

async function syncProducts() {
  console.log('📦 Syncing products...');

  let page = 1;
  let totalSynced = 0;

  while (true) {
    const response = await fetchFromProduction(
      `/products?page=${page}&limit=50&published=all`,
    );

    if (!response || !response.data || response.data.length === 0) break;

    for (const product of response.data) {
      try {
        // Upsert product
        await prisma.product.upsert({
          where: { id: product.id },
          update: {
            name: product.name,
            sku: product.sku,
            description: product.description,
            category_id: product.category_id,
            technical_specs: JSON.stringify(product.technical_specs),
            is_published: product.is_published,
          },
          create: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description,
            category_id: product.category_id,
            technical_specs: JSON.stringify(product.technical_specs),
            is_published: product.is_published,
          },
        });

        // Sync media
        if (product.media && product.media.length > 0) {
          // Delete existing media
          await prisma.media.deleteMany({
            where: { product_id: product.id },
          });

          // Create new media
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

        // Sync style tags
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

        // Sync space tags
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

        totalSynced++;
        process.stdout.write(`\r   Synced ${totalSynced} products...`);
      } catch (error) {
        console.error(
          `\n❌ Error syncing product ${product.sku}:`,
          error.message,
        );
      }
    }

    page++;

    if (!response.pagination || page > response.pagination.total_pages) break;
  }

  console.log(`\n✅ Synced ${totalSynced} products`);
}

async function syncUsers() {
  console.log('👤 Syncing users...');

  // For security, we don't sync passwords from production
  // Instead, create a default admin user
  const defaultAdmin = {
    email: 'admin@local.dev',
    password_hash: '$2b$10$YourHashedPasswordHere', // Change this
    role: 'admin',
  };

  await prisma.user.upsert({
    where: { email: defaultAdmin.email },
    update: {},
    create: defaultAdmin,
  });

  console.log('✅ Created default admin user');
}

async function main() {
  console.log('🚀 Starting production data sync...\n');

  if (!process.env.PRODUCTION_API_URL) {
    console.error('❌ PRODUCTION_API_URL not set in environment variables');
    console.log(
      '💡 Usage: PRODUCTION_API_URL=https://your-api.com/api/v1 node scripts/sync-from-production.js',
    );
    process.exit(1);
  }

  try {
    // Sync in order (dependencies first)
    await syncCategories();
    await syncStyles();
    await syncSpaces();
    await syncProducts();
    await syncUsers();

    console.log('\n✨ Sync completed successfully!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

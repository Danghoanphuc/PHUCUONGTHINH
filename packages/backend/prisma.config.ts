import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Support both PostgreSQL (production) and SQLite (development)
    url: process.env['DATABASE_URL'] || 'file:./dev.db',
  },
});

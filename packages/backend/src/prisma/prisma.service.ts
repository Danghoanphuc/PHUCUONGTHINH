import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

    // Check database type
    const isPostgreSQL =
      dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
    const isTurso =
      dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://');
    const isSQLite = dbUrl.startsWith('file:');

    if (isPostgreSQL) {
      // Use PostgreSQL directly without adapter
      super({
        log:
          process.env.NODE_ENV === 'test'
            ? ['error']
            : process.env.NODE_ENV === 'production'
              ? ['error', 'warn']
              : ['query', 'info', 'warn', 'error'],
      });
    } else if (isTurso) {
      // Use Turso (libSQL) adapter
      const libsql = createClient({
        url: dbUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      const adapter = new PrismaLibSql(libsql);

      super({
        adapter,
        log:
          process.env.NODE_ENV === 'test'
            ? ['error']
            : process.env.NODE_ENV === 'production'
              ? ['error', 'warn']
              : ['query', 'info', 'warn', 'error'],
      } as any);
    } else if (isSQLite) {
      // Use local SQLite with adapter and performance optimizations
      const adapter = new PrismaBetterSQLite3({ url: dbUrl });

      // Apply EXTREME performance pragmas to the underlying database
      const db = (adapter as any).db;
      if (db) {
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('cache_size = -64000');
        db.pragma('temp_store = MEMORY');
        db.pragma('mmap_size = 268435456');
        db.pragma('page_size = 8192');
        db.pragma('busy_timeout = 5000');
        db.pragma('wal_autocheckpoint = 1000');
      }

      super({
        adapter,
        log:
          process.env.NODE_ENV === 'test'
            ? ['error']
            : process.env.NODE_ENV === 'production'
              ? ['error', 'warn']
              : ['query', 'info', 'warn', 'error'],
      } as any);
    } else {
      throw new Error(`Unsupported database URL: ${dbUrl}`);
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

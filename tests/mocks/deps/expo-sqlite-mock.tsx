import { SQLiteDatabase, SQLiteRunResult } from 'expo-sqlite';

export function expoSqliteMock() {
  const Database = require('better-sqlite3');
  let dbInstance: any = null;
  let connectionWrapper: SQLiteDatabase | null = null;
  const statementCache = new Map<string, any>();

  const closeDatabase = () => {
    statementCache.clear();
    if (!dbInstance) {
      return;
    }
    try {
      dbInstance.close();
    } catch {
      // Ignore close errors
    }
    dbInstance = null;
    connectionWrapper = null;
  };

  afterAll(closeDatabase);

  // Caching bounds the native statement handles a suite accumulates, where
  // re-preparing the same SQL allocated a fresh one per call.
  const prepare = (query: string) => {
    const cached = statementCache.get(query);
    if (cached) {
      return cached;
    }
    const statement = dbInstance.prepare(query);
    statementCache.set(query, statement);
    return statement;
  };

  const createConnectionWrapper = (): SQLiteDatabase => {
    // @ts-ignore
    return {
      closeAsync: jest.fn(async (): Promise<void> => {
        closeDatabase();
      }),
      runAsync: jest.fn(async (query: string, params: any[] = []): Promise<SQLiteRunResult> => {
        try {
          const result = prepare(query).run(params);
          return {
            changes: result.changes,
            lastInsertRowId: result.lastInsertRowid || undefined,
          };
        } catch (err: any) {
          throw new Error(`runAsync error: ${err.message}`);
        }
      }),
      execAsync: jest.fn(async (query: string): Promise<void> => {
        try {
          prepare(query).run();
        } catch (err: any) {
          throw new Error(`execAsync error: ${err.message}`);
        }
      }),
      getAllAsync: jest.fn(async <T,>(query: string, params: any[] = []): Promise<T[]> => {
        try {
          return prepare(query).all(params) as T[];
        } catch (err: any) {
          throw new Error(`getAllAsync error: ${err.message}`);
        }
      }),
      getFirstAsync: jest.fn(
        async <T,>(query: string, params: any[] = []): Promise<T | undefined> => {
          try {
            return prepare(query).get(params) as T | undefined;
          } catch (err: any) {
            throw new Error(`getFirstAsync error: ${err.message}`);
          }
        }
      ),
      withTransactionAsync: jest.fn(async <T,>(func: () => Promise<T>): Promise<T> => {
        try {
          return await func();
        } catch (err: any) {
          throw new Error(`withTransactionAsync error: ${err.message}`);
        }
      }),
    } as unknown as SQLiteDatabase;
  };

  return {
    deleteDatabaseAsync: jest.fn(async (): Promise<void> => {
      closeDatabase();
    }),
    openDatabaseAsync: jest.fn(async (): Promise<SQLiteDatabase> => {
      // Reuse existing database and connection wrapper
      if (!dbInstance) {
        dbInstance = new Database(':memory:');
      }
      if (!connectionWrapper) {
        connectionWrapper = createConnectionWrapper();
      }
      return connectionWrapper;
    }),
  };
}

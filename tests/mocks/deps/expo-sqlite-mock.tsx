import { SQLiteDatabase, SQLiteRunResult } from 'expo-sqlite';

export function expoSqliteMock() {
  const Database = require('better-sqlite3');
  let dbInstance: any = null;
  let connectionWrapper: SQLiteDatabase | null = null;

  const createConnectionWrapper = (): SQLiteDatabase => {
    // @ts-ignore
    return {
      closeAsync: jest.fn(async (): Promise<void> => {
        if (dbInstance) {
          try {
            dbInstance.close();
          } catch {
            // Ignore close errors
          }
          dbInstance = null;
          connectionWrapper = null;
        }
      }),
      runAsync: jest.fn(async (query: string, params: any[] = []): Promise<SQLiteRunResult> => {
        try {
          const statement = dbInstance.prepare(query);
          const result = statement.run(params);
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
          dbInstance.prepare(query).run();
        } catch (err: any) {
          throw new Error(`execAsync error: ${err.message}`);
        }
      }),
      getAllAsync: jest.fn(async <T,>(query: string, params: any[] = []): Promise<T[]> => {
        try {
          return dbInstance.prepare(query).all(params) as T[];
        } catch (err: any) {
          throw new Error(`getAllAsync error: ${err.message}`);
        }
      }),
      getFirstAsync: jest.fn(
        async <T,>(query: string, params: any[] = []): Promise<T | undefined> => {
          try {
            return dbInstance.prepare(query).get(params) as T | undefined;
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
      if (dbInstance) {
        try {
          dbInstance.close();
        } catch {
          // Ignore close errors
        }
        dbInstance = null;
        connectionWrapper = null;
      }
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

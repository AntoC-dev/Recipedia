import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { SQLiteDatabase, SQLiteRunResult } from 'expo-sqlite';

const toPlainRow = <T,>(row: unknown): T => ({ ...(row as object) }) as T;

// expo-sqlite accepts both `run(sql, [a, b])` and `run(sql, a, b)`, plus a bare
// scalar for single-parameter queries. node:sqlite only takes spread values.
const bindValues = (params: any[]): any[] =>
  params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

export function expoSqliteMock() {
  const { DatabaseSync: Database } = require('node:sqlite') as {
    DatabaseSync: new (path: string) => DatabaseSync;
  };
  let dbInstance: DatabaseSync | null = null;
  let connectionWrapper: SQLiteDatabase | null = null;
  const statementCache = new Map<string, StatementSync>();

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

  const prepare = (query: string): StatementSync => {
    const cached = statementCache.get(query);
    if (cached) {
      return cached;
    }
    const statement = dbInstance!.prepare(query);
    statementCache.set(query, statement);
    return statement;
  };

  const createConnectionWrapper = (): SQLiteDatabase => {
    // @ts-ignore
    return {
      closeAsync: jest.fn(async (): Promise<void> => {
        closeDatabase();
      }),
      runAsync: jest.fn(async (query: string, ...params: any[]): Promise<SQLiteRunResult> => {
        try {
          const result = prepare(query).run(...bindValues(params));
          return {
            changes: Number(result.changes),
            lastInsertRowId: Number(result.lastInsertRowid),
          };
        } catch (err: any) {
          throw new Error(`runAsync error: ${err.message}`);
        }
      }),
      execAsync: jest.fn(async (query: string): Promise<void> => {
        try {
          dbInstance!.exec(query);
        } catch (err: any) {
          throw new Error(`execAsync error: ${err.message}`);
        }
      }),
      getAllAsync: jest.fn(async <T,>(query: string, ...params: any[]): Promise<T[]> => {
        try {
          return prepare(query)
            .all(...bindValues(params))
            .map(row => toPlainRow<T>(row));
        } catch (err: any) {
          throw new Error(`getAllAsync error: ${err.message}`);
        }
      }),
      getFirstAsync: jest.fn(
        async <T,>(query: string, ...params: any[]): Promise<T | undefined> => {
          try {
            const row = prepare(query).get(...bindValues(params));
            return row === undefined ? undefined : toPlainRow<T>(row);
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

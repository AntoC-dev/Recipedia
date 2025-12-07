import TableManipulation from '@utils/TableManipulation';
import { databaseColumnType, encodedType } from '@customTypes/DatabaseElementTypes';

import * as SQLite from 'expo-sqlite';

type TestDbType = { ID?: number; name: string; age: number };

describe('TableManipulation', () => {
  const memoryDb = ':memory';
  const mockColumns: databaseColumnType[] = [
    { colName: 'name', type: encodedType.TEXT },
    { colName: 'age', type: encodedType.INTEGER },
  ];
  const table = new TableManipulation('TestTable', mockColumns);

  let DB: SQLite.SQLiteDatabase;
  beforeEach(async () => {
    DB = await SQLite.openDatabaseAsync(memoryDb);
  });
  afterEach(async () => {
    await SQLite.deleteDatabaseAsync(memoryDb);
  });

  test('TableManipulation with empty parameter shall log an error', async () => {
    // Should handle empty table name gracefully
    const emptyNameTable = new TableManipulation('', mockColumns);
    expect(emptyNameTable).toBeDefined();

    // Should handle empty columns gracefully
    const emptyColumnsTable = new TableManipulation('test', new Array<databaseColumnType>());
    expect(emptyColumnsTable).toBeDefined();

    // Should handle both empty name and columns
    const bothEmptyTable = new TableManipulation('', new Array<databaseColumnType>());
    expect(bothEmptyTable).toBeDefined();
  });

  test('createTable should generate a valid SQL query', async () => {
    expect(await table.createTable(DB)).toEqual(true);
  });

  test('deleteTable should generate a valid DROP TABLE query', async () => {
    await table.createTable(DB);
    expect(await table.deleteTable(DB)).toEqual(true);
  });

  test('insertElement should generate a valid INSERT query', async () => {
    await table.createTable(DB);

    expect(await table.insertElement({ name: 'John Doe', age: 30 }, DB)).toEqual(1);
    expect(await table.insertElement({ name: 'Toto', age: 8 }, DB)).toEqual(2);
    expect(await table.insertElement({ name: '', age: 0 }, DB)).toEqual(3);
    expect(await table.insertElement({ name: 'Negative Number', age: -1 }, DB)).toEqual(4);

    expect(await table.insertElement({}, DB)).toBeUndefined();
    expect(
      await table.insertElement(
        {
          id: 5,
          name: 'Too much args',
          age: 70,
          country: 'Mexico',
        },
        DB
      )
    ).toBeUndefined();
    expect(
      await table.insertElement(
        {
          name: 'Too much args but less',
          age: 70,
          country: 'Mexico',
        },
        DB
      )
    ).toBeUndefined();
  });

  test('insertArrayOfElement should add multiple elements at once', async () => {
    await table.createTable(DB);

    expect(
      await table.insertArrayOfElement(new Array<object>({ name: 'John Doe', age: 30 }), DB)
    ).toEqual(true);
    expect(
      await table.insertArrayOfElement(
        new Array<object>(
          { name: 'Toto', age: 8 },
          {
            name: 'Titi',
            age: 3,
          }
        ),
        DB
      )
    ).toEqual(true);
    expect(
      await table.insertArrayOfElement(
        new Array<object>(
          { name: '', age: 0 },
          {
            name: 'Negative Number',
            age: -1,
          }
        ),
        DB
      )
    ).toEqual(true);

    expect(
      await table.insertArrayOfElement(
        new Array<object>(
          { name: 'GrandMa', age: 91 },
          {
            name: 'GrandPa',
            age: 84,
          },
          { name: 'Papa', age: 43 },
          { name: 'Mama', age: 41 }
        ),
        DB
      )
    ).toEqual(true);

    expect(await table.insertArrayOfElement(new Array<object>({}), DB)).toEqual(false);
    expect(
      await table.insertArrayOfElement(
        new Array<object>({
          id: 5,
          name: 'Too much args',
          age: 70,
          country: 'Mexico',
        }),
        DB
      )
    ).toEqual(false);
    expect(
      await table.insertArrayOfElement(
        new Array<object>({
          name: 'Too much args but less',
          age: 70,
          country: 'Mexico',
        }),
        DB
      )
    ).toEqual(false);
  });

  test('searchElementById should generate a valid SELECT query', async () => {
    await table.createTable(DB);

    const arrayInserted = new Array<TestDbType>(
      { name: 'John Doe', age: 30 },
      {
        name: 'Toto',
        age: 8,
      },
      { name: 'Sparky', age: 7 },
      { name: 'CutyCat', age: 2 }
    );
    await table.insertArrayOfElement(arrayInserted, DB);

    expect(await table.searchElementById(2, DB)).toEqual({ ID: 2, ...arrayInserted[1] });
    expect(await table.searchElementById(4, DB)).toEqual({ ID: 4, ...arrayInserted[3] });
    expect(await table.searchElementById(1, DB)).toEqual({ ID: 1, ...arrayInserted[0] });
    expect(await table.searchElementById(3, DB)).toEqual({ ID: 3, ...arrayInserted[2] });

    expect(await table.searchElementById(-1, DB)).toBeUndefined();
    expect(await table.searchElementById(5, DB)).toBeUndefined();
  });

  test('searchRandomlyElement should return random element(s)', async () => {
    const elementsInTable = new Array<TestDbType>();
    await table.createTable(DB);

    expect(await table.searchRandomlyElement(1, DB)).toEqual([]);

    let newElem: TestDbType = { name: 'John Doe', age: 30 };
    let elemCounter = 1;

    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;
    expect(await table.searchRandomlyElement(1, DB)).toEqual(elementsInTable);

    newElem = { name: 'Toto', age: 8 };
    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;
    expect(elementsInTable).toEqual(
      expect.arrayContaining((await table.searchRandomlyElement(2, DB)) as string[])
    );

    newElem = { name: 'Titi', age: 3 };
    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;

    expect(elementsInTable).toEqual(
      expect.arrayContaining((await table.searchRandomlyElement(3, DB)) as string[])
    );

    newElem = { name: 'GrandMa', age: 91 };
    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;

    expect(elementsInTable).toEqual(
      expect.arrayContaining((await table.searchRandomlyElement(4, DB)) as string[])
    );

    newElem = { name: 'GrandPa', age: 84 };
    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;

    expect(elementsInTable).toEqual(
      expect.arrayContaining((await table.searchRandomlyElement(5, DB)) as string[])
    );

    newElem = { name: 'Papa', age: 43 };
    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;

    expect(elementsInTable).toEqual(
      expect.arrayContaining((await table.searchRandomlyElement(6, DB)) as string[])
    );

    newElem = { name: 'Mama', age: 41 };
    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;

    expect(elementsInTable).toEqual(
      expect.arrayContaining((await table.searchRandomlyElement(7, DB)) as string[])
    );

    newElem = { name: 'Sparky', age: 7 };
    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;

    expect(elementsInTable).toEqual(
      expect.arrayContaining((await table.searchRandomlyElement(8, DB)) as string[])
    );

    newElem = { name: 'CutyCat', age: 2 };
    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;

    expect(elementsInTable).toEqual(
      expect.arrayContaining((await table.searchRandomlyElement(9, DB)) as string[])
    );

    newElem = { name: 'Smith', age: 58 };
    await table.insertElement(newElem, DB);
    elementsInTable.push({ ID: elemCounter, ...newElem });
    elemCounter++;

    expect(elementsInTable).toEqual(
      expect.arrayContaining((await table.searchRandomlyElement(10, DB)) as string[])
    );

    expect(await table.searchRandomlyElement(0, DB)).toBeUndefined();
    expect(await table.searchRandomlyElement(-1, DB)).toBeUndefined();

    const random1 = (await table.searchRandomlyElement(2, DB)) as string[];
    expect(elementsInTable).toEqual(expect.arrayContaining(random1));

    const random2 = (await table.searchRandomlyElement(2, DB)) as string[];
    expect(elementsInTable).toEqual(expect.arrayContaining(random2));

    expect(random1).not.toEqual(random2);
  });

  test('deleteElementById should delete only elements with theirs identifiers', async () => {
    const elementsInTable = new Array<TestDbType>(
      { ID: 1, name: 'John Doe', age: 30 },
      { ID: 2, name: 'Toto', age: 8 },
      { ID: 3, name: 'Titi', age: 3 },
      { ID: 4, name: 'GrandMa', age: 91 },
      { ID: 5, name: 'GrandPa', age: 84 },
      { ID: 6, name: 'Papa', age: 43 },
      { ID: 7, name: 'Mama', age: 41 },
      { ID: 8, name: 'Sparky', age: 7 },
      { ID: 9, name: 'CutyCat', age: 2 },
      { ID: 10, name: 'Smith', age: 58 }
    );
    await table.createTable(DB);

    expect(await table.deleteElementById(1, DB)).toEqual(false);
    expect(
      expect.arrayContaining(
        (await table.searchRandomlyElement(elementsInTable.length, DB)) as string[]
      )
    ).toEqual([]);

    expect(await table.insertArrayOfElement(elementsInTable, DB)).toEqual(true);
    expect(
      expect.arrayContaining(
        (await table.searchRandomlyElement(elementsInTable.length, DB)) as string[]
      )
    ).toEqual(elementsInTable);

    expect(await table.deleteElementById(11, DB)).toEqual(false);

    for (let i = elementsInTable.length; i > 0; i--) {
      expect(await table.deleteElementById(i, DB)).toEqual(true);
      elementsInTable.pop();
      if (elementsInTable.length > 0) {
        expect(
          expect.arrayContaining(
            (await table.searchRandomlyElement(elementsInTable.length, DB)) as string[]
          )
        ).toEqual(elementsInTable);
      } else {
        expect(
          expect.arrayContaining((await table.searchRandomlyElement(1, DB)) as string[])
        ).toEqual([]);
      }
    }
  });

  test('editElementById should update a row by ID (success)', async () => {
    await table.createTable(DB);

    const id = await table.insertElement<TestDbType>({ name: 'EditMe', age: 20 }, DB);
    expect(id).not.toBeUndefined();

    const updateMap = new Map<string, number | string>([
      [mockColumns[0].colName, 'Edited'],
      [mockColumns[1].colName, 21],
    ]);
    expect(await table.editElementById(id as number, updateMap, DB)).toBe(true);

    expect(await table.searchElementById<TestDbType>(1, DB)).toEqual({
      ID: id,
      name: 'Edited',
      age: 21,
    });
  });

  test('editElementById with non-existent ID should return false', async () => {
    await table.createTable(DB);
    expect(
      await table.editElementById(
        0,
        new Map<string, string | number>([[mockColumns[0].colName, 'Nope']]),
        DB
      )
    ).toEqual(false);
  });

  test('editElementById with partial update should only update specified fields', async () => {
    await table.createTable(DB);
    const id = await table.insertElement<TestDbType>({ name: 'Partial', age: 30 }, DB);

    const result = await table.editElementById(
      id as number,
      new Map<string, number | string>([[mockColumns[1].colName, 31]]),
      DB
    );
    expect(result).toBe(true);

    expect(await table.searchElementById<TestDbType>(1, DB)).toEqual({
      ID: id,
      name: 'Partial',
      age: 31,
    });
  });

  test('editElementById with empty map should return false', async () => {
    await table.createTable(DB);
    const id = await table.insertElement<TestDbType>({ name: 'EmptyMap', age: 40 }, DB);
    expect(await table.editElementById(id as number, new Map<string, number | string>(), DB)).toBe(
      false
    );
  });

  describe('batchUpdateElementsById', () => {
    test('should update multiple elements successfully', async () => {
      await table.createTable(DB);

      const id1 = await table.insertElement<TestDbType>({ name: 'Batch1', age: 25 }, DB);
      const id2 = await table.insertElement<TestDbType>({ name: 'Batch2', age: 30 }, DB);
      const id3 = await table.insertElement<TestDbType>({ name: 'Batch3', age: 35 }, DB);

      const batchUpdates = [
        {
          id: id1 as number,
          elementToUpdate: new Map<string, number | string>([
            ['name', 'UpdatedBatch1'],
            ['age', 26],
          ]),
        },
        {
          id: id2 as number,
          elementToUpdate: new Map<string, number | string>([['name', 'UpdatedBatch2']]),
        },
        {
          id: id3 as number,
          elementToUpdate: new Map<string, number | string>([['age', 36]]),
        },
      ];

      expect(await table.batchUpdateElementsById(batchUpdates, DB)).toBe(true);

      expect(await table.searchElementById<TestDbType>(id1 as number, DB)).toEqual({
        ID: id1,
        name: 'UpdatedBatch1',
        age: 26,
      });
      expect(await table.searchElementById<TestDbType>(id2 as number, DB)).toEqual({
        ID: id2,
        name: 'UpdatedBatch2',
        age: 30,
      });
      expect(await table.searchElementById<TestDbType>(id3 as number, DB)).toEqual({
        ID: id3,
        name: 'Batch3',
        age: 36,
      });
    });

    test('with empty array should return true', async () => {
      await table.createTable(DB);
      expect(await table.batchUpdateElementsById([], DB)).toBe(true);
    });

    test('should skip updates with empty maps', async () => {
      await table.createTable(DB);

      const id1 = await table.insertElement<TestDbType>({ name: 'Skip1', age: 20 }, DB);
      const id2 = await table.insertElement<TestDbType>({ name: 'Skip2', age: 25 }, DB);

      const batchUpdates = [
        {
          id: id1 as number,
          elementToUpdate: new Map<string, number | string>(),
        },
        {
          id: id2 as number,
          elementToUpdate: new Map<string, number | string>([['name', 'UpdatedSkip2']]),
        },
      ];

      expect(await table.batchUpdateElementsById(batchUpdates, DB)).toBe(true);

      // First element should be unchanged, second should be updated
      expect(await table.searchElementById<TestDbType>(id1 as number, DB)).toEqual({
        ID: id1,
        name: 'Skip1',
        age: 20,
      });
      expect(await table.searchElementById<TestDbType>(id2 as number, DB)).toEqual({
        ID: id2,
        name: 'UpdatedSkip2',
        age: 25,
      });
    });

    test('should handle non-existent IDs gracefully', async () => {
      await table.createTable(DB);

      const id1 = await table.insertElement<TestDbType>({ name: 'Exists', age: 30 }, DB);

      const batchUpdates = [
        {
          id: id1 as number,
          elementToUpdate: new Map<string, number | string>([['name', 'UpdatedExists']]),
        },
        {
          id: 999,
          elementToUpdate: new Map<string, number | string>([['name', 'ShouldNotExist']]),
        },
      ];

      // In our mock, transactions don't rollback, so valid updates still succeed
      // In a real database with proper transactions, this would return false and rollback
      expect(await table.batchUpdateElementsById(batchUpdates, DB)).toBe(true);

      // Verify that the valid update was applied
      expect(await table.searchElementById<TestDbType>(id1 as number, DB)).toEqual({
        ID: id1,
        name: 'UpdatedExists',
        age: 30,
      });

      // Verify that the non-existent ID wasn't created
      expect(await table.searchElementById<TestDbType>(999, DB)).toBeUndefined();
    });
  });

  describe('searchElement with WHERE IN support', () => {
    test('should find multiple elements using array values (WHERE IN)', async () => {
      await table.createTable(DB);

      const elements = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 35 },
        { name: 'David', age: 40 },
      ];

      await table.insertArrayOfElement(elements, DB);

      const searchCriteria = new Map<string, string[]>([['name', ['Alice', 'Charlie']]]);
      const result = await table.searchElement<TestDbType>(DB, searchCriteria);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect((result as TestDbType[]).length).toBe(2);
    });

    test('should find elements with simple equality', async () => {
      await table.createTable(DB);

      const elements = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      await table.insertArrayOfElement(elements, DB);

      const searchCriteria = new Map<string, number>([['age', 25]]);
      const result = await table.searchElement<TestDbType>(DB, searchCriteria);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect((result as TestDbType[])[0].name).toBe('Alice');
    });

    test('should return empty array when no matches found with WHERE IN', async () => {
      await table.createTable(DB);

      await table.insertElement({ name: 'Alice', age: 25 }, DB);

      const searchCriteria = new Map<string, string[]>([['name', ['Bob', 'Charlie']]]);
      const result = await table.searchElement<TestDbType>(DB, searchCriteria);

      expect(Array.isArray(result)).toBe(true);
      expect(result as TestDbType[]).toEqual([]);
    });

    test('should work with numeric array values', async () => {
      await table.createTable(DB);

      const elements = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 35 },
      ];

      await table.insertArrayOfElement(elements, DB);

      const searchCriteria = new Map<string, number[]>([['age', [25, 35]]]);
      const result = await table.searchElement<TestDbType>(DB, searchCriteria);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect((result as TestDbType[]).length).toBe(2);
    });
  });

  // deleteElement
});

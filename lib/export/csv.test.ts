import { describe, it, expect } from 'vitest';
import { toCSV } from './csv';

describe('toCSV', () => {
  it('generates CSV with headers and data', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'age', header: 'Age' },
    ];
    const csv = toCSV(data, columns);
    expect(csv).toBe('Name,Age\nAlice,30\nBob,25');
  });

  it('escapes values with commas', () => {
    const data = [{ desc: 'Hello, world', val: 1 }];
    const columns = [
      { key: 'desc', header: 'Description' },
      { key: 'val', header: 'Value' },
    ];
    const csv = toCSV(data, columns);
    expect(csv).toBe('Description,Value\n"Hello, world",1');
  });

  it('escapes values with quotes', () => {
    const data = [{ desc: 'He said "hi"', val: 2 }];
    const columns = [
      { key: 'desc', header: 'Description' },
      { key: 'val', header: 'Value' },
    ];
    const csv = toCSV(data, columns);
    expect(csv).toBe('Description,Value\n"He said ""hi""",2');
  });

  it('handles null and undefined values', () => {
    const data = [{ name: null, age: undefined }];
    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'age', header: 'Age' },
    ];
    const csv = toCSV(data, columns);
    expect(csv).toBe('Name,Age\n,');
  });

  it('handles empty data array', () => {
    const columns = [{ key: 'name', header: 'Name' }];
    const csv = toCSV([], columns);
    expect(csv).toBe('Name');
  });
});

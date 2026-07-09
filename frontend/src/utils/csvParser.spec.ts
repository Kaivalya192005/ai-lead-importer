import { parseCSVClient } from './csvParser';

describe('Client CSV Parser Utility', () => {
  it('should parse simple CSV text into headers and row objects', () => {
    const csv = `name,email,city\nJohn Doe,john@example.com,Austin\nJane Smith,jane@example.com,Seattle`;
    const { headers, rows } = parseCSVClient(csv);

    expect(headers).toEqual(['name', 'email', 'city']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ name: 'John Doe', email: 'john@example.com', city: 'Austin' });
    expect(rows[1]).toEqual({ name: 'Jane Smith', email: 'jane@example.com', city: 'Seattle' });
  });

  it('should handle quoted fields containing commas correctly', () => {
    const csv = `name,comment,source\n"Doe, John",interested in plots,FB\n"Smith, Jane",likes "Luxury Villa",GAds`;
    const { headers, rows } = parseCSVClient(csv);

    expect(headers).toEqual(['name', 'comment', 'source']);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('Doe, John');
    expect(rows[1].name).toBe('Smith, Jane');
    expect(rows[1].comment).toBe('likes "Luxury Villa"');
  });

  it('should ignore empty rows', () => {
    const csv = `name,email\nJohn,john@example.com\n\n\n`;
    const { headers, rows } = parseCSVClient(csv);

    expect(headers).toEqual(['name', 'email']);
    expect(rows).toHaveLength(1);
  });
});

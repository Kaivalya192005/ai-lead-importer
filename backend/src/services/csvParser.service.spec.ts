import { CSVParserService } from './csvParser.service';

describe('CSV Parser Service', () => {
  it('should parse a valid CSV buffer correctly', async () => {
    const csvContent = `name,email,phone\nJohn,john@example.com,123456\nJane,jane@example.com,789012`;
    const buffer = Buffer.from(csvContent);

    const result = await CSVParserService.parse(buffer);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'John', email: 'john@example.com', phone: '123456' });
    expect(result[1]).toEqual({ name: 'Jane', email: 'jane@example.com', phone: '789012' });
  });

  it('should trim whitespace from headers and values', async () => {
    const csvContent = `  Full Name  ,   Email   \n  Alice Smith  ,   alice@example.com  `;
    const buffer = Buffer.from(csvContent);

    const result = await CSVParserService.parse(buffer);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ 'Full Name': 'Alice Smith', Email: 'alice@example.com' });
  });
});

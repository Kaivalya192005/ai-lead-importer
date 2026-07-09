/**
 * High-performance client-side CSV parser.
 * Handles quoted fields, line breaks inside quotes, and trims surrounding spaces.
 */
export function parseCSVClient(text: string): { headers: string[]; rows: any[] } {
  const lines: string[] = [];
  let row: string[] = [''];
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === ',' && !insideQuote) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF after CR
      }
      lines.push(row.join('\u0000'));
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row.join('\u0000'));
  }

  const filteredLines = lines.filter((line) => line.trim() !== '');
  if (filteredLines.length === 0) return { headers: [], rows: [] };

  // Header extraction
  const headers = filteredLines[0]
    .split('\u0000')
    .map((h) => h.replace(/^"(.*)"$/, '$1').trim());

  // Row parsing
  const rows = filteredLines.slice(1).map((line) => {
    const cells = line.split('\u0000').map((c) => c.replace(/^"(.*)"$/, '$1').trim());
    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObj[header] = cells[index] || '';
    });
    return rowObj;
  });

  return { headers, rows };
}

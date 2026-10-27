export function convertToCSV(headers, rows) {
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const headerLine = headers.map(h => escapeCSV(h.label)).join(',');
  const rowLines = rows.map(row => 
    headers.map(h => escapeCSV(row[h.key])).join(',')
  );

  return [headerLine, ...rowLines].join('\r\n');
}

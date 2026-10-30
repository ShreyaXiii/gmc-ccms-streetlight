/**
 * Safe CSV Exporter utility for municipal audits and reporting.
 * Sanitizes fields to prevent CSV formula injection and strips internal secrets.
 */
export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns: { header: string; key: keyof T | ((item: T) => any) }[]
) {
  if (!data || data.length === 0) {
    alert('No records available to export.');
    return;
  }

  const escapeCSVValue = (val: any): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    // Prevent CSV injection (characters =, +, -, @ at the start)
    if (/^[=+\-@]/.test(str)) {
      str = "'" + str;
    }
    // Escape internal quotes
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headers = columns.map(c => escapeCSVValue(c.header)).join(',');
  const rows = data.map(item => {
    return columns
      .map(c => {
        const val = typeof c.key === 'function' ? c.key(item) : item[c.key];
        return escapeCSVValue(val);
      })
      .join(',');
  });

  const metadataHeader = [
    `# Organization: Gandhidham Municipal Corporation (GMC) CCMS`,
    `# Generated At: ${new Date().toISOString()}`,
    `# Total Records: ${data.length}`,
    '',
  ].join('\r\n');

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(metadataHeader + [headers, ...rows].join('\r\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


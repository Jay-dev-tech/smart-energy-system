export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    return;
  }

  const replacer = (key: string, value: any) => (value === null ? '' : value);
  const header = Object.keys(data[0]);
  let csv = data.map((row) =>
    header
      .map((fieldName) => JSON.stringify(row[fieldName], replacer))
      .join(',')
  );
  csv.unshift(header.join(','));
  let csvContent = csv.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-s-8,' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

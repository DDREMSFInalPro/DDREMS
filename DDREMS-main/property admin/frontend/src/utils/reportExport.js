// xlsx and jspdf are loaded on-demand to keep the initial bundle small
// and avoid Vite running out of memory during dev startup.

const COLUMNS = ['Title', 'Type', 'Price (ETB)', 'Owner', 'Status', 'Date'];

const toRows = (properties) =>
  (properties || []).map((p) => [
    p.title ?? '—',
    p.type ?? '—',
    p.price != null ? Number(p.price).toLocaleString() : '—',
    p.owner?.name ?? '—',
    p.verificationStatus ?? '—',
    p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—',
  ]);

export const exportToExcel = async (report, filename = 'report') => {
  const XLSX = await import('xlsx');
  const rows = toRows(report.properties);
  const ws = XLSX.utils.aoa_to_sheet([COLUMNS, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = async (report, title = 'Report', filename = 'report') => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

  const { summary } = report;
  if (summary) {
    doc.setTextColor(0);
    doc.setFontSize(11);
    const lines = Object.entries(summary)
      .map(([k, v]) => `${k}: ${v}`)
      .join('   ');
    doc.text(lines, 14, 34, { maxWidth: 180 });
  }

  autoTable(doc, {
    startY: 44,
    head: [COLUMNS],
    body: toRows(report.properties),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [21, 101, 192] },
  });

  doc.save(`${filename}.pdf`);
};

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function safeSheetName(name, index) {
  const cleaned = String(name || `Sheet ${index + 1}`).replace(/[\\/*?:\[\]]/g, ' ').slice(0, 31).trim()
  return cleaned || `Sheet ${index + 1}`
}

function cell(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`
}

function worksheetXml(sheet, index) {
  const rows = Array.isArray(sheet.rows) ? sheet.rows : []
  return `<Worksheet ss:Name="${xmlEscape(safeSheetName(sheet.name, index))}"><Table>${rows.map((row) => `<Row>${(Array.isArray(row) ? row : [row]).map(cell).join('')}</Row>`).join('')}</Table></Worksheet>`
}

export function downloadExcelWorkbook(filename, sheets) {
  const xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheets.map(worksheetXml).join('')}</Workbook>`
  const blob = new Blob([`\ufeff${xml}`], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1500)
}

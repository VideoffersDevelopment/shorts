import type { ExportColumn } from "@/components/admin/data-table/types"

/**
 * Export data to CSV format
 */
export function exportToCSV<TData>(
  data: TData[],
  columns: ExportColumn<TData>[],
  filename: string
): void {
  // Build header row
  const headers = columns.map((col) => `"${escapeCSV(col.header)}"`)
  const headerRow = headers.join(",")

  // Build data rows
  const rows = data.map((row) => {
    const values = columns.map((col) => {
      let value: unknown

      if (col.accessor) {
        value = col.accessor(row)
      } else if (typeof col.key === "string" && col.key.includes(".")) {
        // Handle nested keys like "user.email"
        value = getNestedValue(row, col.key)
      } else {
        value = row[col.key as keyof TData]
      }

      // Format value for CSV
      if (value === null || value === undefined) {
        return ""
      }
      if (value instanceof Date) {
        return `"${value.toISOString()}"`
      }
      if (typeof value === "boolean") {
        return value ? "true" : "false"
      }
      if (typeof value === "number") {
        return String(value)
      }
      return `"${escapeCSV(String(value))}"`
    })
    return values.join(",")
  })

  // Combine header and rows
  const csv = [headerRow, ...rows].join("\n")

  // Add BOM for Excel compatibility with UTF-8
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" })

  downloadBlob(blob, `${filename}.csv`)
}

/**
 * Export data to Excel-compatible format (using CSV with Excel-friendly encoding)
 * For true .xlsx support, consider adding the 'xlsx' library
 */
export function exportToExcel<TData>(
  data: TData[],
  columns: ExportColumn<TData>[],
  filename: string
): void {
  // Build HTML table for Excel
  const headerCells = columns
    .map((col) => `<th>${escapeHtml(col.header)}</th>`)
    .join("")
  const headerRow = `<tr>${headerCells}</tr>`

  const bodyRows = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          let value: unknown

          if (col.accessor) {
            value = col.accessor(row)
          } else if (typeof col.key === "string" && col.key.includes(".")) {
            value = getNestedValue(row, col.key)
          } else {
            value = row[col.key as keyof TData]
          }

          // Format value
          if (value === null || value === undefined) {
            return "<td></td>"
          }
          if (value instanceof Date) {
            return `<td>${value.toLocaleDateString()}</td>`
          }
          if (typeof value === "boolean") {
            return `<td>${value ? "Yes" : "No"}</td>`
          }
          return `<td>${escapeHtml(String(value))}</td>`
        })
        .join("")
      return `<tr>${cells}</tr>`
    })
    .join("")

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Sheet1</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <thead>${headerRow}</thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
    </html>
  `

  const blob = new Blob([html], { type: "application/vnd.ms-excel" })
  downloadBlob(blob, `${filename}.xls`)
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Escape special characters for CSV
 */
function escapeCSV(value: string): string {
  // Double up any double quotes
  return value.replace(/"/g, '""')
}

/**
 * Escape HTML special characters
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Trigger browser download of a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

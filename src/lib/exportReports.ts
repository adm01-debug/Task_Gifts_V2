/**
 * Export Reports Utility
 * Generates PDF and Excel reports for managers
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ============================================
// Types
// ============================================

export interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  generatedBy: string;
  sections: ReportSection[];
}

export interface ReportSection {
  title: string;
  type: "table" | "summary" | "chart-data";
  data: Record<string, unknown>[];
  columns?: { key: string; label: string; format?: "number" | "currency" | "percent" | "date" }[];
}

export interface ExportOptions {
  format: "csv" | "excel" | "pdf";
  filename?: string;
  includeTimestamp?: boolean;
}

// ============================================
// CSV Export
// ============================================

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatValue(
  value: unknown, 
  formatType?: "number" | "currency" | "percent" | "date"
): string {
  if (value === null || value === undefined) return "-";
  
  switch (formatType) {
    case "number":
      return typeof value === "number" ? value.toLocaleString("pt-BR") : String(value);
    case "currency":
      return typeof value === "number" 
        ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : String(value);
    case "percent":
      return typeof value === "number" ? `${value.toFixed(1)}%` : String(value);
    case "date":
      return value instanceof Date 
        ? format(value, "dd/MM/yyyy", { locale: ptBR })
        : String(value);
    default:
      return String(value);
  }
}

export function exportToCSV(report: ReportData, options: ExportOptions = { format: "csv" }): void {
  const lines: string[] = [];
  
  // Header
  lines.push(`# ${report.title}`);
  if (report.subtitle) {
    lines.push(`# ${report.subtitle}`);
  }
  lines.push(`# Gerado em: ${format(report.generatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);
  lines.push(`# Por: ${report.generatedBy}`);
  lines.push("");
  
  // Sections
  report.sections.forEach((section) => {
    lines.push(`## ${section.title}`);
    
    if (section.columns && section.data.length > 0) {
      // Header row
      lines.push(section.columns.map((col) => escapeCSVValue(col.label)).join(","));
      
      // Data rows
      section.data.forEach((row) => {
        const values = section.columns!.map((col) => {
          const value = row[col.key];
          return escapeCSVValue(formatValue(value, col.format));
        });
        lines.push(values.join(","));
      });
    } else if (section.data.length > 0) {
      // Auto-detect columns from first row
      const keys = Object.keys(section.data[0]);
      lines.push(keys.map(escapeCSVValue).join(","));
      
      section.data.forEach((row) => {
        const values = keys.map((key) => escapeCSVValue(row[key]));
        lines.push(values.join(","));
      });
    }
    
    lines.push("");
  });
  
  const csvContent = lines.join("\n");
  downloadFile(csvContent, getFilename(report.title, "csv", options), "text/csv;charset=utf-8;");
}

// ============================================
// Excel Export (using CSV with Excel-friendly encoding)
// ============================================

export function exportToExcel(report: ReportData, options: ExportOptions = { format: "excel" }): void {
  const lines: string[] = [];
  
  // BOM for UTF-8 Excel compatibility
  const BOM = "\uFEFF";
  
  // Use semicolon as separator for better Excel compatibility in PT-BR locales
  const separator = ";";
  
  // Title section
  lines.push(`${report.title}`);
  if (report.subtitle) {
    lines.push(report.subtitle);
  }
  lines.push(`Gerado em: ${format(report.generatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);
  lines.push(`Por: ${report.generatedBy}`);
  lines.push("");
  
  // Sections
  report.sections.forEach((section) => {
    lines.push(section.title);
    
    if (section.columns && section.data.length > 0) {
      // Header row
      lines.push(section.columns.map((col) => col.label).join(separator));
      
      // Data rows
      section.data.forEach((row) => {
        const values = section.columns!.map((col) => {
          const value = row[col.key];
          return formatValue(value, col.format);
        });
        lines.push(values.join(separator));
      });
    } else if (section.data.length > 0) {
      const keys = Object.keys(section.data[0]);
      lines.push(keys.join(separator));
      
      section.data.forEach((row) => {
        const values = keys.map((key) => String(row[key] ?? ""));
        lines.push(values.join(separator));
      });
    }
    
    lines.push("");
  });
  
  const content = BOM + lines.join("\n");
  downloadFile(
    content, 
    getFilename(report.title, "xlsx", options), 
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

// ============================================
// PDF Export (HTML-based)
// ============================================

export function exportToPDF(report: ReportData, options: ExportOptions = { format: "pdf" }): void {
  const html = generatePDFHTML(report);
  
  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for styles to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

function generatePDFHTML(report: ReportData): string {
  const sectionsHTML = report.sections.map((section) => {
    let tableHTML = "";
    
    if (section.columns && section.data.length > 0) {
      const headerRow = section.columns
        .map((col) => `<th>${col.label}</th>`)
        .join("");
      
      const dataRows = section.data
        .map((row) => {
          const cells = section.columns!
            .map((col) => {
              const value = row[col.key];
              return `<td>${formatValue(value, col.format)}</td>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      
      tableHTML = `
        <table>
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${dataRows}</tbody>
        </table>
      `;
    } else if (section.data.length > 0) {
      const keys = Object.keys(section.data[0]);
      const headerRow = keys.map((key) => `<th>${key}</th>`).join("");
      
      const dataRows = section.data
        .map((row) => {
          const cells = keys.map((key) => `<td>${row[key] ?? "-"}</td>`).join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      
      tableHTML = `
        <table>
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${dataRows}</tbody>
        </table>
      `;
    }
    
    return `
      <section>
        <h2>${section.title}</h2>
        ${tableHTML}
      </section>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${report.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #1a1a1a;
          padding: 20mm;
        }
        
        header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e5e5e5;
        }
        
        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #111;
          margin-bottom: 4px;
        }
        
        .subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .meta {
          font-size: 11px;
          color: #888;
        }
        
        section {
          margin-bottom: 25px;
        }
        
        h2 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #eee;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e5e5;
        }
        
        th {
          background: #f8f8f8;
          font-weight: 600;
          color: #444;
        }
        
        tr:nth-child(even) {
          background: #fafafa;
        }
        
        tr:hover {
          background: #f5f5f5;
        }
        
        @media print {
          body {
            padding: 10mm;
          }
          
          section {
            page-break-inside: avoid;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      <header>
        <h1>${report.title}</h1>
        ${report.subtitle ? `<p class="subtitle">${report.subtitle}</p>` : ""}
        <p class="meta">
          Gerado em ${format(report.generatedAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          por ${report.generatedBy}
        </p>
      </header>
      
      <main>
        ${sectionsHTML}
      </main>
    </body>
    </html>
  `;
}

// ============================================
// Utility Functions
// ============================================

function getFilename(title: string, extension: string, options: ExportOptions): string {
  const baseFilename = options.filename || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const timestamp = options.includeTimestamp !== false ? `_${format(new Date(), "yyyy-MM-dd_HH-mm")}` : "";
  return `${baseFilename}${timestamp}.${extension}`;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// ============================================
// Main Export Function
// ============================================

export function exportReport(report: ReportData, options: ExportOptions): void {
  switch (options.format) {
    case "csv":
      exportToCSV(report, options);
      break;
    case "excel":
      exportToExcel(report, options);
      break;
    case "pdf":
      exportToPDF(report, options);
      break;
    default:
      break;
  }
}

// ============================================
// Pre-built Report Generators
// ============================================

export function createTeamPerformanceReport(
  teamName: string,
  generatedBy: string,
  members: {
    name: string;
    level: number;
    xp: number;
    questsCompleted: number;
    streak: number;
    coins: number;
  }[]
): ReportData {
  const totalXP = members.reduce((sum, m) => sum + m.xp, 0);
  const avgLevel = members.length > 0 ? members.reduce((sum, m) => sum + m.level, 0) / members.length : 0;
  
  return {
    title: `Relatório de Performance - ${teamName}`,
    subtitle: `Análise detalhada da equipe`,
    generatedAt: new Date(),
    generatedBy,
    sections: [
      {
        title: "Resumo Geral",
        type: "summary",
        data: [
          { metric: "Total de Membros", value: members.length },
          { metric: "XP Total da Equipe", value: totalXP },
          { metric: "Nível Médio", value: avgLevel.toFixed(1) },
          { metric: "Quests Completadas", value: members.reduce((sum, m) => sum + m.questsCompleted, 0) },
        ],
        columns: [
          { key: "metric", label: "Métrica" },
          { key: "value", label: "Valor" },
        ],
      },
      {
        title: "Performance Individual",
        type: "table",
        data: members.map((m) => ({
          nome: m.name,
          nivel: m.level,
          xp: m.xp,
          quests: m.questsCompleted,
          streak: m.streak,
          moedas: m.coins,
        })),
        columns: [
          { key: "nome", label: "Nome" },
          { key: "nivel", label: "Nível", format: "number" },
          { key: "xp", label: "XP", format: "number" },
          { key: "quests", label: "Quests", format: "number" },
          { key: "streak", label: "Streak (dias)", format: "number" },
          { key: "moedas", label: "Moedas", format: "number" },
        ],
      },
    ],
  };
}

export function createEngagementReport(
  generatedBy: string,
  data: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    avgSessionDuration: number;
    topAchievements: { name: string; unlocks: number }[];
    topTrails: { name: string; completions: number }[];
  }
): ReportData {
  return {
    title: "Relatório de Engajamento",
    subtitle: "Análise de uso e participação na plataforma",
    generatedAt: new Date(),
    generatedBy,
    sections: [
      {
        title: "Métricas de Usuários Ativos",
        type: "summary",
        data: [
          { metric: "DAU (Diário)", value: data.dailyActiveUsers },
          { metric: "WAU (Semanal)", value: data.weeklyActiveUsers },
          { metric: "MAU (Mensal)", value: data.monthlyActiveUsers },
          { metric: "Tempo Médio de Sessão", value: `${data.avgSessionDuration} min` },
        ],
        columns: [
          { key: "metric", label: "Métrica" },
          { key: "value", label: "Valor" },
        ],
      },
      {
        title: "Conquistas Mais Desbloqueadas",
        type: "table",
        data: data.topAchievements,
        columns: [
          { key: "name", label: "Conquista" },
          { key: "unlocks", label: "Desbloqueios", format: "number" },
        ],
      },
      {
        title: "Trilhas Mais Completadas",
        type: "table",
        data: data.topTrails,
        columns: [
          { key: "name", label: "Trilha" },
          { key: "completions", label: "Conclusões", format: "number" },
        ],
      },
    ],
  };
}

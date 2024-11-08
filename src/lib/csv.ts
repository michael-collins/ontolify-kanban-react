export interface CSVParseResult {
  headers: string[];
  content: string;
}

export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (!inQuotes) {
        // Start of quoted field
        inQuotes = true;
      } else if (i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote within quoted field
        currentField += '"';
        i++; // Skip next quote
      } else {
        // End of quoted field
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field (only if not in quotes)
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
    i++;
  }

  // Add the last field
  fields.push(currentField);

  // Clean up fields
  return fields.map(field => {
    // Remove leading/trailing whitespace
    field = field.trim();
    
    // Handle quoted fields
    if (field.startsWith('"') && field.endsWith('"')) {
      // Remove wrapping quotes and unescape internal quotes
      field = field.slice(1, -1).replace(/""/g, '"');
    }
    
    return field;
  });
}

export function parseCSV(text: string): CSVParseResult {
  try {
    // Remove BOM if present and trim whitespace
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    
    // Split into lines, preserving quoted newlines
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;
    let i = 0;

    while (i < cleanText.length) {
      const char = cleanText[i];

      if (char === '"') {
        if (!inQuotes) {
          inQuotes = true;
        } else if (i + 1 < cleanText.length && cleanText[i + 1] === '"') {
          // Escaped quote within quoted field
          currentLine += '""'; // Preserve escaped quotes
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // Line break outside quotes
        if (char === '\r' && i + 1 < cleanText.length && cleanText[i + 1] === '\n') {
          i++; // Skip \n in \r\n
        }
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
      i++;
    }
    
    // Add the last line if not empty
    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    if (lines.length < 1) {
      throw new Error('CSV must contain at least headers');
    }

    // Parse headers
    const headers = parseCSVLine(lines[0])
      .map(header => header
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      )
      .filter(header => header);

    if (headers.length === 0) {
      throw new Error('CSV must contain at least one valid column header');
    }

    // Validate all rows have the same number of columns
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      // Pad row with empty strings if it has fewer columns than headers
      while (row.length < headers.length) {
        row.push('');
      }
      // Reconstruct the line with proper CSV formatting
      lines[i] = row.map(field => {
        if (field.includes('"') || field.includes(',') || field.includes('\n')) {
          // Escape quotes and wrap in quotes if needed
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',');
    }

    return {
      headers,
      content: lines.join('\n')
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse CSV file: Invalid format');
  }
}
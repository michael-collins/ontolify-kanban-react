import { useState, useEffect, useCallback, useMemo } from 'react';
import { loadFromGitHub } from '@/lib/github';
import { getAuthToken } from '@/lib/storage';
import { parseCSVLine } from '@/lib/csv';
import type { LibraryFile } from '@/types/library';

interface LibraryItem {
  id: string;
  term: string;
  libraryFileId: string;
  [key: string]: string | undefined;
}

interface UseLibraryItemsResult {
  items: LibraryItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLibraryItems(libraries: LibraryFile[] = []): UseLibraryItemsResult {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a stable key for the libraries array that only changes when relevant properties change
  const librariesKey = useMemo(() => 
    libraries
      .map(lib => `${lib.id}:${lib.gitConfig.path}:${lib.lastModified || ''}`)
      .join(','),
    [libraries]
  );

  const loadLibraryItems = useCallback(async () => {
    const token = getAuthToken();
    if (!token || libraries.length === 0) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loadedItems: LibraryItem[] = [];
      
      for (const library of libraries) {
        try {
          const content = await loadFromGitHub({
            token,
            ...library.gitConfig
          });

          if (content) {
            const parsedItems = parseLibraryCSV(content, library);
            const itemsWithLibraryId = parsedItems.map(item => ({
              ...item,
              libraryFileId: library.id
            }));
            loadedItems.push(...itemsWithLibraryId);
          }
        } catch (parseError) {
          console.error(`Failed to parse library ${library.id}:`, parseError);
        }
      }

      // Deduplicate items based on term and libraryFileId
      const uniqueItems = loadedItems.reduce((acc, item) => {
        const key = `${item.libraryFileId}-${item.term}`;
        if (!acc.has(key)) {
          acc.set(key, item);
        }
        return acc;
      }, new Map<string, LibraryItem>());

      setItems(Array.from(uniqueItems.values()));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load library items';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [libraries]);

  useEffect(() => {
    loadLibraryItems();
  }, [librariesKey]);

  return {
    items,
    isLoading,
    error,
    refresh: loadLibraryItems
  };
}

function parseLibraryCSV(text: string, library: LibraryFile): LibraryItem[] {
  // Remove BOM if present and trim whitespace
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  
  // Split into lines, preserving quoted newlines
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    
    if (char === '"') {
      if (inQuotes && cleanText[i + 1] === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && cleanText[i + 1] === '\n') {
        i++; // Skip \n in \r\n
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  // Filter out empty rows and get headers
  const nonEmptyRows = lines.filter(line => line.trim());
  if (nonEmptyRows.length === 0) return [];

  // Use library fields if available, otherwise parse from first row
  const headers = library.fields || parseCSVLine(nonEmptyRows[0])
    .map(header => header
      .replace(/^["']|["']$/g, '') // Remove quotes
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    )
    .filter(header => header);

  // Create items with all fields from CSV
  return nonEmptyRows.slice(1)
    .map((line, index) => {
      const values = parseCSVLine(line);
      const item: LibraryItem = {
        id: `${library.id}-item-${index}`,
        term: values[0]?.replace(/^["']|["']$/g, '').trim() || '',
        libraryFileId: '',
      };

      // Map CSV columns to item fields
      headers.forEach((header, i) => {
        if (values[i]) {
          item[header] = values[i].replace(/^["']|["']$/g, '').trim();
        }
      });

      return item;
    })
    .filter(item => item.term); // Only include items with a term
}
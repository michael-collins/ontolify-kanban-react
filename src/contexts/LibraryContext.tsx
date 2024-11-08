import { createContext, useContext, ReactNode } from 'react';
import { useLibraryItems } from '@/hooks/use-library-items';
import type { LibraryFile } from '@/types/library';

interface LibraryContextType {
  items: Array<{
    id: string;
    term: string;
    libraryFileId: string;
    [key: string]: string | undefined;
  }>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

interface LibraryProviderProps {
  children: ReactNode;
  libraries: LibraryFile[];
}

export function LibraryProvider({ children, libraries }: LibraryProviderProps) {
  const libraryData = useLibraryItems(libraries);

  return (
    <LibraryContext.Provider value={libraryData}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibraryContext() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibraryContext must be used within a LibraryProvider');
  }
  return context;
}
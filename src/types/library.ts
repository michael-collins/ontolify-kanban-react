import type { GitConfig } from './app';

export interface LibraryFile {
  id: string;
  name: string;
  gitConfig: GitConfig;
  lastModified?: string;
  fields?: string[];
}

export interface LibraryItem {
  id: string;
  term: string;
  libraryFileId?: string;
  [key: string]: string | undefined;
}

export interface TaskHyperTag {
  term: string;
  libraryItemId: string;
  libraryFileId: string;
}
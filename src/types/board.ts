import type { GitConfig } from './app';

export interface Board {
  id: string;
  name: string;
  gitConfig: GitConfig;
  lastModified: string;
}

export interface BoardConfig {
  boards: Board[];
  gitConfig?: GitConfig;
}
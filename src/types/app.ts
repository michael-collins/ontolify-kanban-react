export interface GitConfig {
  owner: string;
  repo: string;
  path: string;
}

export interface Board {
  id: string;
  name: string;
  gitConfig: GitConfig;
  lastModified: string;
}

export interface AppConfig {
  gitConfig: GitConfig | null;
  boards: Board[];
  libraries: LibraryFile[];
}
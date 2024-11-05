export interface Board {
  id: string;
  name: string;
  gitConfig?: {
    owner: string;
    repo: string;
    path: string;
  };
  lastModified: string;
}

export interface BoardConfig {
  boards: Board[];
  gitConfig?: {
    owner: string;
    repo: string;
    path: string;
  };
}
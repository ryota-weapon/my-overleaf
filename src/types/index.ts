export interface Project {
  id: string;
  name: string;
  path: string;
  mainFile: string;
  lastModified: Date;
  status: 'idle' | 'compiling' | 'success' | 'error';
}

export interface CompilationResult {
  success: boolean;
  pdfPath?: string;
  errors?: string[];
  logs: string;
}

export interface WatchEvent {
  type: 'change' | 'add' | 'unlink';
  path: string;
  projectId: string;
}
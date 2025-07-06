export interface ProjectFile {
  name: string;
  path: string;
  type: 'tex' | 'bib' | 'image' | 'directory' | 'other';
  content?: string;
  lastModified: Date;
  children?: ProjectFile[];
}

export interface Project {
  id: string;
  name: string;
  path: string;
  mainFile: string;
  files: ProjectFile[];
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
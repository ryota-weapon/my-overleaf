import chokidar from 'chokidar';
import path from 'path';
import { LaTeXCompiler } from './compiler';

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private compiler: LaTeXCompiler;
  private callbacks: Map<string, (result: any) => void> = new Map();

  constructor() {
    this.compiler = new LaTeXCompiler();
  }

  start() {
    if (this.watcher) {
      this.stop();
    }

    const papersDir = path.join(process.cwd(), 'papers');
    
    this.watcher = chokidar.watch(`${papersDir}/**/*.tex`, {
      ignored: /build/,
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', async (filePath) => {
      console.log(`File changed: ${filePath}`);
      
      const projectId = this.extractProjectId(filePath);
      if (projectId) {
        await this.compileProject(projectId);
      }
    });

    console.log('File watcher started');
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  onCompilationComplete(projectId: string, callback: (result: any) => void) {
    this.callbacks.set(projectId, callback);
  }

  private extractProjectId(filePath: string): string | null {
    const papersDir = path.join(process.cwd(), 'papers');
    const relativePath = path.relative(papersDir, filePath);
    const parts = relativePath.split(path.sep);
    return parts.length > 0 ? parts[0] : null;
  }

  private async compileProject(projectId: string) {
    try {
      console.log(`Auto-compiling project: ${projectId}`);
      const result = await this.compiler.compile(projectId);
      
      const callback = this.callbacks.get(projectId);
      if (callback) {
        callback(result);
      }
      
      console.log(`Compilation ${result.success ? 'succeeded' : 'failed'} for ${projectId}`);
    } catch (error) {
      console.error(`Auto-compilation failed for ${projectId}:`, error);
    }
  }
}

let globalWatcher: FileWatcher | null = null;

export function getWatcher(): FileWatcher {
  if (!globalWatcher) {
    globalWatcher = new FileWatcher();
    globalWatcher.start();
  }
  return globalWatcher;
}
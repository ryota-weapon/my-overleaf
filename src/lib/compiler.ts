import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { CompilationResult } from '@/types';

const execAsync = promisify(exec);

export class LaTeXCompiler {
  private projectsDir: string;

  constructor() {
    this.projectsDir = path.join(process.cwd(), 'papers');
  }

  async compile(projectId: string, mainFile: string = 'main.tex'): Promise<CompilationResult> {
    const projectPath = path.join(this.projectsDir, projectId);
    const texFilePath = path.join(projectPath, mainFile);
    const buildDir = path.join(projectPath, 'build');

    try {
      await fs.mkdir(buildDir, { recursive: true });

      const command = `cd "${projectPath}" && /Library/TeX/texbin/pdflatex -output-directory=build -interaction=nonstopmode "${mainFile}"`;
      
      const { stdout, stderr } = await execAsync(command);
      
      const pdfPath = path.join(buildDir, mainFile.replace('.tex', '.pdf'));
      const logPath = path.join(buildDir, mainFile.replace('.tex', '.log'));
      
      const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
      
      let logs = '';
      try {
        logs = await fs.readFile(logPath, 'utf-8');
      } catch {
        logs = stdout + stderr;
      }

      const errors = this.parseErrors(logs);

      return {
        success: pdfExists && errors.length === 0,
        pdfPath: pdfExists ? pdfPath : undefined,
        errors: errors.length > 0 ? errors : undefined,
        logs
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        logs: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseErrors(logs: string): string[] {
    const errors: string[] = [];
    const lines = logs.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('!') || line.includes('Error:') || line.includes('error:')) {
        errors.push(line.trim());
      }
    }
    
    return errors;
  }
}
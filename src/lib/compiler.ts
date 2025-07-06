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

      // Run pdflatex multiple times to resolve references and bibliography
      const command = `cd "${projectPath}" && /Library/TeX/texbin/pdflatex -output-directory=build -interaction=nonstopmode "${mainFile}"`;
      
      // First pass
      let { stdout, stderr } = await execAsync(command);
      
      // Check if there are .bib files and run bibtex if needed
      const bibFiles = await this.findBibFiles(projectPath);
      if (bibFiles.length > 0) {
        const baseName = mainFile.replace('.tex', '');
        const bibtexCommand = `cd "${buildDir}" && /Library/TeX/texbin/bibtex "${baseName}"`;
        try {
          await execAsync(bibtexCommand);
          // Run pdflatex again after bibtex
          await execAsync(command);
        } catch (bibtexError) {
          console.log('BibTeX warning (non-fatal):', bibtexError);
        }
      }
      
      // Final pass to resolve all references
      await execAsync(command);
      
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

  private async findBibFiles(projectPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(projectPath);
      return files.filter(file => file.endsWith('.bib'));
    } catch {
      return [];
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
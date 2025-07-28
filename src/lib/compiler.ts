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

      // Detect document class to determine compiler
      const texContent = await fs.readFile(texFilePath, 'utf-8');
      const isJapanese = texContent.includes('jsreport') || texContent.includes('jsarticle') || texContent.includes('jsbook');
      
      if (isJapanese) {
        // Use platex for Japanese documents
        const platexCommand = `cd "${projectPath}" && /Library/TeX/texbin/platex -interaction=nonstopmode "${mainFile}"`;
        
        // First pass
        let { stdout, stderr } = await execAsync(platexCommand);
        
        // Check if there are .bib files and run jbibtex if needed
        const bibFiles = await this.findBibFiles(projectPath);
        if (bibFiles.length > 0) {
          const baseName = mainFile.replace('.tex', '');
          const jbibtexCommand = `cd "${projectPath}" && /Library/TeX/texbin/jbibtex "${baseName}"`;
          try {
            await execAsync(jbibtexCommand);
            // Run platex again after jbibtex
            await execAsync(platexCommand);
          } catch (bibtexError) {
            console.log('JBibTeX warning (non-fatal):', bibtexError);
          }
        }
        
        // Final pass to resolve all references
        await execAsync(platexCommand);
        
        // Convert DVI to PDF
        const dviPath = path.join(projectPath, mainFile.replace('.tex', '.dvi'));
        const dvipdfmxCommand = `cd "${projectPath}" && /Library/TeX/texbin/dvipdfmx "${mainFile.replace('.tex', '.dvi')}"`;
        await execAsync(dvipdfmxCommand);
        
        // Move PDF to build directory
        const sourcePdfPath = path.join(projectPath, mainFile.replace('.tex', '.pdf'));
        const targetPdfPath = path.join(buildDir, mainFile.replace('.tex', '.pdf'));
        await fs.rename(sourcePdfPath, targetPdfPath);
        
        const logPath = path.join(projectPath, mainFile.replace('.tex', '.log'));
        
        const pdfExists = await fs.access(targetPdfPath).then(() => true).catch(() => false);
        
        let logs = '';
        try {
          logs = await fs.readFile(logPath, 'utf-8');
        } catch {
          logs = stdout + stderr;
        }

        const errors = this.parseErrors(logs);

        return {
          success: pdfExists && errors.length === 0,
          pdfPath: pdfExists ? targetPdfPath : undefined,
          errors: errors.length > 0 ? errors : undefined,
          logs
        };
      } else {
        // Use pdflatex for English/standard documents
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
      }
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
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ProjectFile } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectPath = path.join(process.cwd(), 'papers', params.projectId);
    
    try {
      await fs.access(projectPath);
    } catch {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const buildFileTree = async (dirPath: string, relativePath: string = ''): Promise<ProjectFile[]> => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: ProjectFile[] = [];

      for (const entry of entries) {
        if (entry.name === 'build') continue; // Skip build directory
        
        const fullPath = path.join(dirPath, entry.name);
        const relativeFilePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        const stats = await fs.stat(fullPath);
        
        if (entry.isDirectory()) {
          const children = await buildFileTree(fullPath, relativeFilePath);
          files.push({
            name: entry.name,
            path: relativeFilePath,
            type: 'directory',
            lastModified: stats.mtime,
            children
          });
        } else {
          let type: ProjectFile['type'] = 'other';
          if (entry.name.endsWith('.tex')) type = 'tex';
          else if (entry.name.endsWith('.bib')) type = 'bib';
          else if (entry.name.match(/\.(png|jpg|jpeg|gif|pdf)$/i)) type = 'image';

          files.push({
            name: entry.name,
            path: relativeFilePath,
            type,
            lastModified: stats.mtime
          });
        }
      }

      files.sort((a, b) => {
        if (a.name === 'main.tex') return -1;
        if (b.name === 'main.tex') return 1;
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (b.type === 'directory' && a.type !== 'directory') return 1;
        if (a.type === 'tex' && b.type !== 'tex') return -1;
        if (b.type === 'tex' && a.type !== 'tex') return 1;
        return a.name.localeCompare(b.name);
      });

      return files;
    };

    const files = await buildFileTree(projectPath);
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error reading project files:', error);
    return NextResponse.json(
      { error: 'Failed to read project files' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { fileName, type, parentPath } = await request.json();
    
    if (!fileName || !type) {
      return NextResponse.json(
        { error: 'fileName and type are required' },
        { status: 400 }
      );
    }

    const projectPath = path.join(process.cwd(), 'papers', params.projectId);
    const targetDir = parentPath 
      ? path.join(projectPath, parentPath)
      : projectPath;
    const itemPath = path.join(targetDir, fileName);

    try {
      await fs.access(itemPath);
      return NextResponse.json(
        { error: `${type === 'directory' ? 'Directory' : 'File'} already exists` },
        { status: 409 }
      );
    } catch {
      // Item doesn't exist, which is good
    }

    if (type === 'directory') {
      await fs.mkdir(itemPath, { recursive: true });
      return NextResponse.json({ message: 'Directory created successfully' });
    } else {
      let defaultContent = '';
      if (type === 'tex') {
        defaultContent = `\\section{New Section}\n\nContent goes here...\n`;
      } else if (type === 'bib') {
        defaultContent = `@article{example2024,\n  title={Example Article},\n  author={Author Name},\n  journal={Journal Name},\n  year={2024}\n}\n`;
      }

      await fs.writeFile(itemPath, defaultContent);
      return NextResponse.json({ message: 'File created successfully' });
    }
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
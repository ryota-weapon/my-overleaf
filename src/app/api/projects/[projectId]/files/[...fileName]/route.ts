import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; fileName: string[] } }
) {
  try {
    const fileName = params.fileName.join('/');
    const filePath = path.join(process.cwd(), 'papers', params.projectId, fileName);
    
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      return new NextResponse(content, {
        headers: { 
          'Content-Type': 'text/plain',
          'Last-Modified': stats.mtime.toUTCString()
        }
      });
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; fileName: string[] } }
) {
  try {
    const { content } = await request.json();
    
    if (content === undefined) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const fileName = params.fileName.join('/');
    const filePath = path.join(process.cwd(), 'papers', params.projectId, fileName);
    
    await fs.writeFile(filePath, content);
    
    return NextResponse.json({ message: 'File saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; fileName: string[] } }
) {
  try {
    const fileName = params.fileName.join('/');
    if (fileName === 'main.tex') {
      return NextResponse.json(
        { error: 'Cannot delete main.tex file' },
        { status: 403 }
      );
    }

    const filePath = path.join(process.cwd(), 'papers', params.projectId, fileName);
    
    try {
      await fs.unlink(filePath);
      return NextResponse.json({ message: 'File deleted successfully' });
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
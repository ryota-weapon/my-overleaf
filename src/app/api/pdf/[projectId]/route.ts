import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    const pdfPath = path.join(process.cwd(), 'papers', projectId, 'build', 'main.pdf');

    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: 'PDF not found' }, 
        { status: 404 }
      );
    }

    const pdfBuffer = fs.readFileSync(pdfPath);

    // Get file modification time for cache busting
    const stats = fs.statSync(pdfPath);
    const lastModified = stats.mtime.toUTCString();
    const etag = `"${stats.mtime.getTime()}-${stats.size}"`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': lastModified,
        'ETag': etag,
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
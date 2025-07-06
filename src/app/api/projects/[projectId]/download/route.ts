import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const pdfPath = path.join(process.cwd(), 'papers', params.projectId, 'build', 'main.pdf');
    
    try {
      const pdfBuffer = await fs.readFile(pdfPath);
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${params.projectId}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch {
      return NextResponse.json({ error: 'PDF not found. Please compile the project first.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json(
      { error: 'Failed to download PDF' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { LaTeXCompiler } from '@/lib/compiler';

export async function POST(request: NextRequest) {
  try {
    const { projectId, mainFile } = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' }, 
        { status: 400 }
      );
    }

    const compiler = new LaTeXCompiler();
    const result = await compiler.compile(projectId, mainFile);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Compilation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
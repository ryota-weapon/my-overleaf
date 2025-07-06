import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' }, 
        { status: 400 }
      );
    }

    // Sanitize project name
    const projectId = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const projectPath = path.join(process.cwd(), 'papers', projectId);

    // Check if project already exists
    try {
      await fs.access(projectPath);
      return NextResponse.json(
        { error: 'Project already exists' }, 
        { status: 409 }
      );
    } catch {
      // Project doesn't exist, which is good
    }

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Create basic main.tex file
    const basicTexContent = `\\documentclass{article}
\\usepackage{amsmath}

\\title{${name}}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

Write your content here...

\\end{document}`;

    await fs.writeFile(path.join(projectPath, 'main.tex'), basicTexContent);

    return NextResponse.json({ 
      id: projectId, 
      name,
      message: 'Project created successfully' 
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' }, 
      { status: 500 }
    );
  }
}
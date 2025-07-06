import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';

async function getProjects() {
  try {
    const papersDir = path.join(process.cwd(), 'papers');
    await fs.mkdir(papersDir, { recursive: true });
    
    const items = await fs.readdir(papersDir, { withFileTypes: true });
    const projects = [];
    
    for (const item of items) {
      if (item.isDirectory()) {
        const projectPath = path.join(papersDir, item.name);
        const files = await fs.readdir(projectPath);
        const mainFile = files.find(f => f.endsWith('.tex')) || 'main.tex';
        
        projects.push({
          id: item.name,
          name: item.name,
          mainFile,
          path: projectPath
        });
      }
    }
    
    return projects;
  } catch (error) {
    console.error('Error reading projects:', error);
    return [];
  }
}

import ClientHomePage from '@/components/ClientHomePage';

export default async function Home() {
  const projects = await getProjects();

  return <ClientHomePage projects={projects} />;
}

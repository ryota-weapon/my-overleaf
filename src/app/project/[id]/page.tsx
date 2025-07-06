'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PDFViewer from '@/components/PDFViewer';
import FileTree from '@/components/FileTree';
import FileEditor from '@/components/FileEditor';
import { CompilationResult, ProjectFile } from '@/types';
import { useFileWatcher } from '@/hooks/useFileWatcher';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [lastResult, setLastResult] = useState<CompilationResult | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});

  const compileProject = async () => {
    setCompiling(true);
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          mainFile: 'main.tex'
        }),
      });

      const result: CompilationResult = await response.json();
      setLastResult(result);

      if (result.success && result.pdfPath) {
        // Add timestamp to prevent caching
        setPdfFile(`/api/pdf/${projectId}?t=${Date.now()}`);
      }
    } catch (error) {
      console.error('Compilation failed:', error);
      setLastResult({
        success: false,
        errors: ['Network error during compilation'],
        logs: 'Failed to reach compilation server'
      });
    } finally {
      setCompiling(false);
    }
  };

  useEffect(() => {
    loadProjectFiles();
    compileProject();
  }, [projectId]);

  // Handle external file changes
  const handleExternalFileChange = async (filename: string) => {
    console.log('External file change detected:', filename);
    console.log('Currently selected file:', selectedFile);
    // Force reload the file content
    await loadFileContent(filename, true);
    console.log('File content reloaded for:', filename);
  };

  useFileWatcher(projectId, handleExternalFileChange);

  const loadProjectFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`);
      if (response.ok) {
        const projectFiles: ProjectFile[] = await response.json();
        setFiles(projectFiles);
        if (projectFiles.length > 0) {
          const mainFile = projectFiles.find(f => f.name === 'main.tex') || projectFiles[0];
          setSelectedFile(mainFile.name);
          // Load initial file content
          await loadFileContent(mainFile.name);
        }
      }
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  };

  const loadFileContent = async (fileName: string, forceReload = false) => {
    if (!forceReload && fileContents[fileName]) return fileContents[fileName];
    
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${fileName}`);
      if (response.ok) {
        const content = await response.text();
        setFileContents(prev => ({ ...prev, [fileName]: content }));
        return content;
      }
    } catch (error) {
      console.error('Failed to load file content:', error);
    }
    return '';
  };

  const handleFileSelect = async (fileName: string) => {
    setSelectedFile(fileName);
    await loadFileContent(fileName);
  };

  const handleFileContentChange = (content: string) => {
    if (selectedFile) {
      setFileContents(prev => ({ ...prev, [selectedFile]: content }));
    }
  };

  const handleFileSave = async () => {
    if (!selectedFile) return;
    
    try {
      await fetch(`/api/projects/${projectId}/files/${selectedFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContents[selectedFile] })
      });
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleFileCreate = async (fileName: string, type: 'tex' | 'bib') => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, type })
      });
      
      if (response.ok) {
        await loadProjectFiles();
        setSelectedFile(fileName);
      }
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleDirectoryCreate = async (dirName: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: dirName, type: 'directory' })
      });
      
      if (response.ok) {
        await loadProjectFiles();
      }
    } catch (error) {
      console.error('Failed to create directory:', error);
    }
  };

  const handleFileDelete = async (fileName: string) => {
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      try {
        await fetch(`/api/projects/${projectId}/files/${fileName}`, {
          method: 'DELETE'
        });
        
        await loadProjectFiles();
        if (selectedFile === fileName) {
          const mainFile = files.find(f => f.name === 'main.tex');
          setSelectedFile(mainFile?.name || null);
        }
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/"
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Projects
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Project: {projectId}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                compiling
                  ? 'bg-yellow-500 animate-pulse'
                  : lastResult?.success
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600">
              {compiling
                ? 'Compiling...'
                : lastResult?.success
                ? 'Compiled successfully'
                : 'Compilation failed'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={compileProject}
              disabled={compiling}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {compiling ? 'Compiling...' : 'Compile'}
            </button>
            
            {lastResult?.success && (
              <a
                href={`/api/projects/${projectId}/download`}
                download={`${projectId}.pdf`}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* File Tree */}
        <FileTree
          files={files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onFileCreate={handleFileCreate}
          onDirectoryCreate={handleDirectoryCreate}
          onFileDelete={handleFileDelete}
        />
        
        {/* File Editor */}
        {selectedFile && (
          <div className="flex-1 border-r">
            <FileEditor
              fileName={selectedFile}
              content={fileContents[selectedFile] || ''}
              onChange={handleFileContentChange}
              onSave={handleFileSave}
            />
          </div>
        )}
        
        {/* PDF Viewer */}
        <div className="flex-1">
          <PDFViewer file={pdfFile} className="h-full" />
        </div>

        {/* Error/Log panel */}
        {lastResult && !lastResult.success && (
          <div className="w-80 bg-red-50 border-l p-4 overflow-auto">
            <h3 className="font-semibold text-red-800 mb-2">Compilation Errors</h3>
            {lastResult.errors && (
              <div className="mb-4">
                {lastResult.errors.map((error, index) => (
                  <div key={index} className="text-red-700 text-sm mb-1">
                    {error}
                  </div>
                ))}
              </div>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer text-red-600 mb-2">
                View full logs
              </summary>
              <pre className="text-red-600 whitespace-pre-wrap">
                {lastResult.logs}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PDFViewer from '@/components/PDFViewer';
import { CompilationResult } from '@/types';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [lastResult, setLastResult] = useState<CompilationResult | null>(null);

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
        setPdfFile(`/api/pdf/${projectId}`);
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
    compileProject();
  }, [projectId]);

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

          {/* Compile button */}
          <button
            onClick={compileProject}
            disabled={compiling}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {compiling ? 'Compiling...' : 'Compile'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
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
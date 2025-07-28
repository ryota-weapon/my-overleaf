'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Configure PDF.js for better CJK font support
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.cMapUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/';
  pdfjs.GlobalWorkerOptions.cMapPacked = true;
}

interface PDFViewerProps {
  file: string | null;
  className?: string;
}

export default function PDFViewer({ file, className = '' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    setError(error.message);
    setLoading(false);
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  if (!file) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <p className="text-gray-500">No PDF to display</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-gray-100 h-full ${className}`}>
      {/* Controls - Fixed at top */}
      <div className="flex items-center justify-between p-4 bg-white border-b flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="px-2 text-gray-900 font-medium">
            {numPages} pages
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="px-3 py-1 bg-gray-500 text-white rounded"
          >
            Zoom Out
          </button>
          <span className="px-2 text-gray-900 font-medium">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            className="px-3 py-1 bg-gray-500 text-white rounded"
          >
            Zoom In
          </button>
        </div>
      </div>

      {/* PDF Display - Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100">
        {error ? (
          <div className="text-red-500 text-center p-8">
            Error loading PDF: {error}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 py-4">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="text-center p-8">Loading PDF...</div>}
              options={{
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true,
                standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
              }}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} className="mb-4 shadow-lg bg-white">
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
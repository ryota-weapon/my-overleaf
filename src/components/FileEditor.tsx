'use client';

import { useState, useEffect } from 'react';

interface FileEditorProps {
  fileName: string;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

export default function FileEditor({ fileName, content, onChange, onSave }: FileEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setLocalContent(content);
    setHasUnsavedChanges(false);
  }, [content, fileName]);

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    setHasUnsavedChanges(newContent !== content);
    onChange(newContent);
  };

  const handleSave = () => {
    onSave();
    setHasUnsavedChanges(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const getFileType = (fileName: string) => {
    if (fileName.endsWith('.tex')) return 'latex';
    if (fileName.endsWith('.bib')) return 'bibtex';
    return 'text';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">{fileName}</span>
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-500">• Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {getFileType(fileName).toUpperCase()}
          </span>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`px-3 py-1 text-xs rounded ${
              hasUnsavedChanges
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save (⌘S)
          </button>
        </div>
      </div>

      <div className="flex-1">
        <textarea
          value={localContent}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 font-mono text-sm border-none outline-none resize-none"
          placeholder={`Start editing ${fileName}...`}
          spellCheck={false}
        />
      </div>

      {getFileType(fileName) === 'latex' && (
        <div className="bg-gray-50 border-t px-4 py-2">
          <div className="text-xs text-gray-600">
            <strong>LaTeX Tips:</strong> Use \input{"{filename}"} to include other .tex files, 
            \bibliography{"{bibfile}"} for citations
          </div>
        </div>
      )}

      {getFileType(fileName) === 'bibtex' && (
        <div className="bg-gray-50 border-t px-4 py-2">
          <div className="text-xs text-gray-600">
            <strong>BibTeX Tips:</strong> Add @article{"{key}"}, @book{"{key}"}, etc. entries. 
            Use \cite{"{key}"} in your .tex files
          </div>
        </div>
      )}
    </div>
  );
}
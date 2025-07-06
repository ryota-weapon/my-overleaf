'use client';

import { ProjectFile } from '@/types';
import { useState } from 'react';

interface FileTreeProps {
  files: ProjectFile[];
  selectedFile: string | null;
  onFileSelect: (fileName: string) => void;
  onFileCreate: (fileName: string, type: 'tex' | 'bib') => void;
  onDirectoryCreate: (dirName: string) => void;
  onFileDelete: (fileName: string) => void;
}

export default function FileTree({ 
  files, 
  selectedFile, 
  onFileSelect, 
  onFileCreate, 
  onDirectoryCreate,
  onFileDelete 
}: FileTreeProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'tex' | 'bib' | 'directory'>('tex');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const getFileIcon = (type: ProjectFile['type'], isExpanded?: boolean) => {
    switch (type) {
      case 'tex': return '📄';
      case 'bib': return '📚';
      case 'image': return '🖼️';
      case 'directory': return isExpanded ? '📂' : '📁';
      default: return '📄';
    }
  };

  const renderFileItem = (file: ProjectFile, depth: number = 0) => {
    const isExpanded = expandedDirs.has(file.name);
    const isSelected = selectedFile === file.path;
    
    return (
      <div key={file.path}>
        <div
          className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-200 ${
            isSelected ? 'bg-blue-100 border border-blue-300' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (file.type === 'directory') {
              toggleDirectory(file.name);
            } else {
              onFileSelect(file.path);
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <span>{getFileIcon(file.type, isExpanded)}</span>
            <span className="text-sm text-gray-700">{file.name}</span>
          </div>
          {file.name !== 'main.tex' && file.type !== 'directory' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileDelete(file.path);
              }}
              className="text-red-500 hover:text-red-700 text-xs"
              title="Delete file"
            >
              ×
            </button>
          )}
        </div>
        
        {file.type === 'directory' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleCreateItem = () => {
    if (newItemName.trim()) {
      if (newItemType === 'directory') {
        onDirectoryCreate(newItemName.trim());
      } else {
        const extension = newItemType === 'tex' ? '.tex' : '.bib';
        const fileName = newItemName.endsWith(extension) 
          ? newItemName 
          : `${newItemName}${extension}`;
        
        onFileCreate(fileName, newItemType);
      }
      setNewItemName('');
      setShowNewDialog(false);
    }
  };

  const toggleDirectory = (dirName: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirName)) {
      newExpanded.delete(dirName);
    } else {
      newExpanded.add(dirName);
    }
    setExpandedDirs(newExpanded);
  };

  return (
    <div className="w-64 bg-gray-50 border-r p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Files</h3>
        <button
          onClick={() => setShowNewDialog(true)}
          className="text-blue-500 hover:text-blue-700 text-sm"
          title="Add new item"
        >
          + New
        </button>
      </div>

      {showNewDialog && (
        <div className="mb-4 p-3 bg-white border rounded">
          <input
            type="text"
            placeholder={newItemType === 'directory' ? 'Directory name' : 'File name'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm mb-2 text-gray-900 bg-white"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateItem()}
          />
          <select
            value={newItemType}
            onChange={(e) => setNewItemType(e.target.value as 'tex' | 'bib' | 'directory')}
            className="w-full px-2 py-1 border rounded text-sm mb-2 text-gray-900 bg-white"
          >
            <option value="tex">LaTeX File (.tex)</option>
            <option value="bib">Bibliography (.bib)</option>
            <option value="directory">Directory</option>
          </select>
          <div className="flex space-x-2">
            <button
              onClick={handleCreateItem}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewDialog(false)}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {files.map((file) => renderFileItem(file))}
      </div>
    </div>
  );
}
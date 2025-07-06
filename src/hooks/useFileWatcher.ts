import { useEffect, useRef } from 'react';

export function useFileWatcher(
  projectId: string,
  onFileChange: (filename: string) => void
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileTimestampsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!projectId) return;

    const checkFileChanges = async () => {
      try {
        console.log('Checking file changes...');
        const response = await fetch(`/api/projects/${projectId}/files`);
        if (response.ok) {
          const files = await response.json();
          
          // Flatten the file tree to get all tex/bib files
          const flattenFiles = (fileList: any[]): string[] => {
            const result: string[] = [];
            for (const file of fileList) {
              if (file.type === 'directory' && file.children) {
                result.push(...flattenFiles(file.children));
              } else if (file.type === 'tex' || file.type === 'bib') {
                result.push(file.path);
              }
            }
            return result;
          };
          
          const allTexFiles = flattenFiles(files);
          console.log('Files to check:', allTexFiles);
          
          for (const filePath of allTexFiles) {
            const fileResponse = await fetch(`/api/projects/${projectId}/files/${filePath}`, {
              method: 'HEAD'
            });
            
            if (fileResponse.ok) {
              const lastModified = fileResponse.headers.get('Last-Modified');
              if (lastModified) {
                const timestamp = new Date(lastModified).getTime();
                const previousTimestamp = fileTimestampsRef.current[filePath];
                
                console.log(`File ${filePath}: current=${timestamp}, previous=${previousTimestamp}`);
                
                if (previousTimestamp && timestamp > previousTimestamp) {
                  console.log('File changed via polling:', filePath);
                  onFileChange(filePath);
                }
                
                fileTimestampsRef.current[filePath] = timestamp;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking file changes:', error);
      }
    };

    // Initial timestamp collection
    checkFileChanges();
    
    // Poll every 2 seconds
    intervalRef.current = setInterval(checkFileChanges, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [projectId, onFileChange]);

  const disconnect = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { disconnect };
}
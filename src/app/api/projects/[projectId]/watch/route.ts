import { NextRequest } from 'next/server';
import { watch } from 'fs';
import { join } from 'path';

// Debounce file changes to reduce event spam
const debounceMap = new Map<string, NodeJS.Timeout>();

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const projectPath = join(process.cwd(), 'papers', params.projectId);
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
      
      // Watch for file changes with debouncing
      const watcher = watch(projectPath, { recursive: true }, (eventType, filename) => {
        if (filename && !filename.includes('build/') && (filename.endsWith('.tex') || filename.endsWith('.bib'))) {
          const key = `${params.projectId}:${filename}`;
          
          // Clear existing timeout
          if (debounceMap.has(key)) {
            clearTimeout(debounceMap.get(key)!);
          }
          
          // Set new timeout to debounce rapid changes
          debounceMap.set(key, setTimeout(() => {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'file-changed',
              filename,
              eventType
            })}\n\n`);
            debounceMap.delete(key);
          }, 300)); // 300ms debounce
        }
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        watcher.close();
        controller.close();
        // Clean up any pending timeouts
        debounceMap.forEach((timeout, key) => {
          if (key.startsWith(`${params.projectId}:`)) {
            clearTimeout(timeout);
            debounceMap.delete(key);
          }
        });
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
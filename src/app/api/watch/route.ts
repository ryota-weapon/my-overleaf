import { NextRequest } from 'next/server';
import { getWatcher } from '@/lib/watcher';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return new Response('Project ID required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const watcher = getWatcher();
      
      watcher.onCompilationComplete(projectId, (result) => {
        const data = `data: ${JSON.stringify(result)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      });

      const keepAlive = setInterval(() => {
        controller.enqueue(new TextEncoder().encode('data: {"type":"ping"}\n\n'));
      }, 30000);

      return () => {
        clearInterval(keepAlive);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
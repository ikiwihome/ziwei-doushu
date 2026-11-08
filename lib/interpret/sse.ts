// Decode complete SSE data lines even when TCP chunks split lines or UTF-8 characters.
export async function* readSseData(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let pending = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += done ? decoder.decode() + '\n' : decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data:')) yield line.slice(5).trim();
      }
      if (done) return;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

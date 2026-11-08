import type { ZiweiChart } from '@/lib/ziwei/types';
import { readSseData } from './sse';

export interface InterpretMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function streamInterpretation(
  chart: ZiweiChart,
  messages: InterpretMessage[],
  onText: (text: string) => void,
  liunianYear?: number,
) {
  const response = await fetch('/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chart, messages: messages.slice(-12), liunianYear }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || '解读请求失败，请稍后重试。');
  }
  if (!response.body) throw new Error('解读服务没有返回内容。');

  let text = '';
  for await (const data of readSseData(response.body)) {
    if (data === '[DONE]' && text.trim()) return;
    if (data === '[DONE]') break;
    const event = JSON.parse(data);
    if (event.error) throw new Error(event.error);
    if (typeof event.delta?.text === 'string') {
      text += event.delta.text;
      onText(text);
    }
  }
  throw new Error('解读未完整返回，请重试。');
}

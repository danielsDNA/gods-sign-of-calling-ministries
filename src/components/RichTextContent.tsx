import type { CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';

import { richTextToMarkdown } from '@/lib/content-text';

interface RichTextContentProps {
  value: string | null | undefined;
  className?: string;
  style?: CSSProperties;
}

export default function RichTextContent({ value, className = '', style }: RichTextContentProps) {
  return (
    <div className={`cms-rich-text ${className}`} style={style}>
      <ReactMarkdown>{richTextToMarkdown(value || '')}</ReactMarkdown>
    </div>
  );
}

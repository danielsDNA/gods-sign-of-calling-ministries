import { describe, expect, it } from 'vitest';
import { richTextToMarkdown, richTextToPlainText, sanitizeRichTextHtml } from './content-text';

describe('richTextToPlainText', () => {
  it('preserves paragraph breaks while removing markup and common entities', () => {
    expect(richTextToPlainText('<p>Church &amp; community</p><p>Second<br>line</p>'))
      .toBe('Church & community\nSecond\nline');
  });

  describe('sanitizeRichTextHtml', () => {
    it('keeps supported formatting while stripping attributes and executable content', () => {
      expect(sanitizeRichTextHtml(
        '<p onclick="alert(1)"><strong>Safe</strong><img src=x onerror="alert(2)"><script>alert(3)</script></p>',
      )).toBe('<p><strong>Safe</strong></p>');
    });
  });

  describe('richTextToMarkdown', () => {
    it('keeps supported emphasis while dropping presentation-only tags and attributes', () => {
      expect(richTextToMarkdown('<p><b>Serve</b> with <em>love</em></p><p><span style="color:red">Together</span></p>'))
        .toBe('**Serve** with *love*\n\nTogether');
    });
  });
});

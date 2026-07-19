import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../utils/security';

describe('sanitizeInput', () => {
  it('should return empty string for falsy input', () => {
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
    expect(sanitizeInput('')).toBe('');
  });

  it('should strip HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('alert(1)');
    expect(sanitizeInput('<b>bold</b> and <i>italic</i>')).toBe('bold and italic');
    expect(sanitizeInput('Hello <b>world</b>!')).toBe('Hello world!');
    expect(sanitizeInput('a&b')).toBe('a&b');
    expect(sanitizeInput('a<b')).toBe('a<b');
    expect(sanitizeInput('a"b')).toBe('a"b');
    expect(sanitizeInput("a'b")).toBe("a'b");
  });
});
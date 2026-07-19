import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeInput, ClientRateLimiter } from '../utils/security';
import { getLanguageLabel, detectQueryLanguage } from '../utils/lang';

describe('Security Utilities', () => {
  describe('sanitizeInput', () => {
    it('should return empty string for undefined/empty input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput((undefined as any))).toBe('');
    });

    it('should strip out HTML tags', () => {
      const input = '<div>Hello <span>World</span><script>alert(1)</script></div>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<div');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello Worldalert(1)');
    });

    it('should not escape characters (only strip tags)', () => {
      const input = 'Hello & "World" / \'A\' > <';
      const result = sanitizeInput(input);
      // Since there are no tags, output should be input trimmed
      expect(result).toBe(input.trim());
    });

    it('should trim whitespace', () => {
      const input = '   hello world   ';
      expect(sanitizeInput(input)).toBe('hello world');
    });
  });

  describe('ClientRateLimiter', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow requests up to the max threshold', () => {
      const limiter = new ClientRateLimiter(3, 1000);
      expect(limiter.allowRequest()).toBe(true);
      expect(limiter.allowRequest()).toBe(true);
      expect(limiter.allowRequest()).toBe(true);
      expect(limiter.allowRequest()).toBe(false); // throttled
    });

    it('should recycle tokens over sliding time window', () => {
      const limiter = new ClientRateLimiter(2, 1000);
      expect(limiter.allowRequest()).toBe(true);
      expect(limiter.allowRequest()).toBe(true);
      expect(limiter.allowRequest()).toBe(false);

      // Advance clock by 1001ms
      vi.advanceTimersByTime(1001);
      expect(limiter.allowRequest()).toBe(true);
    });

    it('should calculate cooldown period remaining in seconds', () => {
      const limiter = new ClientRateLimiter(2, 60000);
      expect(limiter.getCooldownSeconds()).toBe(0);

      limiter.allowRequest();
      
      expect(limiter.getCooldownSeconds()).toBe(60);
      
      vi.advanceTimersByTime(15000);
      expect(limiter.getCooldownSeconds()).toBe(45);
    });
  });
});

describe('Language Utilities', () => {
  describe('getLanguageLabel', () => {
    it('should return matching name for supported codes', () => {
      expect(getLanguageLabel('en')).toBe('English');
      expect(getLanguageLabel('es')).toBe('Español');
      expect(getLanguageLabel('fr')).toBe('Français');
    });

    it('should default to English for invalid codes', () => {
      expect(getLanguageLabel('invalid')).toBe('English');
    });
  });

  describe('detectQueryLanguage', () => {
    it('should detect Spanish', () => {
      expect(detectQueryLanguage('¿Dónde está el baño?')).toBe('es');
      expect(detectQueryLanguage('ayuda por favor')).toBe('es');
    });

    it('should detect French', () => {
      expect(detectQueryLanguage('Où est la toilette?')).toBe('fr');
      expect(detectQueryLanguage('Il y a une fuite d\'eau')).toBe('fr');
    });

    it('should detect Portuguese', () => {
      expect(detectQueryLanguage('onde fica o banheiro')).toBe('pt');
      expect(detectQueryLanguage('aqui tem briga')).toBe('pt');
    });

    it('should detect Arabic', () => {
      expect(detectQueryLanguage('أين الحمام')).toBe('ar');
    });

    it('should detect German', () => {
      expect(detectQueryLanguage('wo ist das stadion')).toBe('de');
      expect(detectQueryLanguage('wasser bitte')).toBe('de');
    });

    it('should default to English', () => {
      expect(detectQueryLanguage('Hello, where is section 104?')).toBe('en');
    });
  });
});

/**
 * Centralized language properties and utility helpers
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ar', name: 'العربية' }
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

/**
 * Returns the human-readable language label from code
 */
export function getLanguageLabel(code: string): string {
  const match = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return match ? match.name : 'English';
}

/**
 * Heuristic detector for spectator query languages based on vocabulary markers
 */
export function detectQueryLanguage(text: string): LanguageCode {
  const normalized = text.toLowerCase();
  
  // Spanish markers
  if (
    normalized.includes('bano') || normalized.includes('baño') || 
    normalized.includes('donde') || normalized.includes('dónde') || 
    normalized.includes('agua') || normalized.includes('por favor') ||
    normalized.includes('pelea') || normalized.includes('ayuda')
  ) {
    return 'es';
  }
  
  // French markers
  if (
    normalized.includes('toilette') || normalized.includes('ou est') || 
    normalized.includes('où est') || normalized.includes('s\'il vous plaît') || 
    normalized.includes('fuite') || normalized.includes('aide')
  ) {
    return 'fr';
  }

  // Portuguese markers
  if (
    normalized.includes('banheiro') || normalized.includes('onde fica') || 
    normalized.includes('água') || normalized.includes('por favor') ||
    normalized.includes('briga')
  ) {
    return 'pt';
  }

  // Arabic markers
  if (
    normalized.includes('حمام') || normalized.includes('أين') || 
    normalized.includes('ماء') || normalized.includes('من فضلك') ||
    normalized.includes('مساعدة')
  ) {
    return 'ar';
  }

  // German markers
  if (
    normalized.includes('toilette') || normalized.includes('wo ist') || 
    normalized.includes('bitte') || normalized.includes('wasser') ||
    normalized.includes('hilfe')
  ) {
    return 'de';
  }

  return 'en';
}

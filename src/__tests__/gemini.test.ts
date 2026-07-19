import { describe, it, expect } from 'vitest';
import { chatWithAI, analyzeIncident } from '../utils/gemini';
import { INITIAL_FACILITIES, INITIAL_GATES } from '../data/mockDb';

describe('Gemini AI Fallback pipeline tests', () => {

  it('should answer restroom requests with local database queue advice', async () => {
    const response = await chatWithAI(
      "Where is the nearest toilet?", 
      [], 
      INITIAL_FACILITIES, 
      INITIAL_GATES
    );
    expect(response).toContain("Restroom");
  });

  it('should suggest concession food stands with wait time recommendations', async () => {
    const response = await chatWithAI(
      "I want to buy tacos", 
      [], 
      INITIAL_FACILITIES, 
      INITIAL_GATES
    );
    // Pretzel stand is recommended since it has a 3 min wait compared to Taco's 4 min wait
    expect(response).toContain("Pretzels");
  });

  it('should categorize maintenance incident reports dynamically', async () => {
    const result = await analyzeIncident("Water leak at section 104");
    expect(result.category).toBe("maintenance");
    expect(result.severity).toBe("medium");
    expect(result.title).toContain("Water leak");
  });

  it('should categorize critical medical incident reports dynamically', async () => {
    const result = await analyzeIncident("A spectator is unconscious and has fainted in section 201");
    expect(result.category).toBe("medical");
    expect(result.severity).toBe("critical");
    expect(result.title).toContain("Medical aid");
  });

});

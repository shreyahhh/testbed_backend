/**
 * AI Scoring Service with Gemini SDK + REST (v1beta) fallback
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const HARDCODED_GEMINI_KEY = 'AIzaSyBfp5VvN6dt7wFzY8sTd4fTv-URMGuXWzM'; // TEMP — remove before commit

class AIService {
  constructor() {
    const key = process.env.GEMINI_API_KEY || HARDCODED_GEMINI_KEY;
    this.key = key;
    this.enabled = !!key;

    // Updated to use available Gemini 2.x models
    this.modelNames = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

    if (this.enabled) {
      this.genAI = new GoogleGenerativeAI(key);
    }
  }

  async scoreResponse(gameType, responseData, config) {
    const aiPrompts = config.ai_prompts || {};
    const competencies = Object.keys(config.final_weights || {});
    const prompt = this.buildPrompt(gameType, responseData, aiPrompts, competencies);

    if (!this.enabled) return this.getMockScores(competencies);

    return await this.callGeminiAPI(prompt, competencies);
  }

  buildPrompt(gameType, responseData, aiPrompts, competencies) {
    let header = `You are an expert evaluator for cognitive assessments. Score the user response across listed competencies (0-100 each). Be strict but fair.\n\n`;
    let context = '';

    switch (gameType) {
      case 'scenario_challenge':
        context += `SCENARIO:\n${responseData.scenario_text || '(missing scenario_text)'}\n\n`;
        context += `USER RESPONSE:\n${responseData.user_response || '(missing user_response)'}\n\n`;
        break;
      case 'ai_debate':
        context += `DEBATE TOPIC:\n${responseData.topic || '(missing topic)'}\n\n`;
        context += `USER ARGUMENT:\n${responseData.user_argument || '(missing user_argument)'}\n\n`;
        break;
      case 'statement_reasoning':
        context += `STATEMENT:\n${responseData.statement || '(missing statement)'}\n\n`;
        context += `USER ANALYSIS:\n${responseData.analysis || '(missing analysis)'}\n\n`;
        break;
      case 'creative_uses':
        context += `OBJECT / SUBJECT:\n${responseData.subject || '(missing subject)'}\n\n`;
        context += `USER LIST OF USES:\n${Array.isArray(responseData.uses) ? responseData.uses.join('\n') : responseData.uses || '(missing uses)'}\n\n`;
        break;
      default:
        context += `RAW USER DATA:\n${JSON.stringify(responseData, null, 2)}\n\n`;
    }

    let competenciesSection = `EVALUATE THE FOLLOWING COMPETENCIES (0-100 each):\n\n`;
    for (const c of competencies) {
      competenciesSection += `${c.toUpperCase()}:\n${aiPrompts[c] || `Evaluate the user's performance for ${c}.`}\n\n`;
    }

    const jsonFormat = `Return ONLY valid JSON:\n{\n${competencies.map(c => `  "${c}": <number 0-100>,`).join('\n')}\n  "feedback": "<brief explanation of scores>"\n}\nNo commentary outside JSON.`;

    return header + context + competenciesSection + jsonFormat;
  }

  async callGeminiAPI(prompt, competencies) {
    let lastErr;

    for (const name of this.modelNames) {
      // 1) Try SDK call
      try {
        const model = this.genAI.getGenerativeModel({ model: name });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return this.normalizeScores(text, competencies);
      } catch (err) {
        lastErr = err;
        const msg = String(err?.message || err);

        // 2) If SDK fails due to v1beta/model mismatch, try direct REST v1beta for this model
        if (/not\s*found|404|v1beta|unsupported/i.test(msg)) {
          try {
            const text = await this.callGeminiRESTv1beta(name, prompt);
            return this.normalizeScores(text, competencies);
          } catch (restErr) {
            lastErr = restErr;
            continue; // try next model
          }
        } else {
          break; // non-model error (e.g., auth/billing); stop trying
        }
      }
    }

    console.error('Gemini API Error:', lastErr);
    throw new Error(`AI scoring failed: ${lastErr?.message || lastErr}`);
  }

  async callGeminiRESTv1beta(modelName, prompt) {
    // Updated to use v1beta endpoint (instead of v1)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(this.key)}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3
      }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok) {
      const msg = data?.error?.message || JSON.stringify(data);
      throw new Error(`[REST v1beta ${resp.status}] ${msg}`);
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ??
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      '';

    if (!text) throw new Error('Empty response from REST v1beta');
    return text;
  }

  normalizeScores(rawText, competencies) {
    const parsed = this.safeParseJSON(rawText);
    if (!parsed) throw new Error('AI response not valid JSON');

    const scores = {};
    for (const c of competencies) {
      let v = Number(parsed[c]);
      if (Number.isNaN(v)) v = 0;
      v = Math.max(0, Math.min(100, v));
      scores[c] = v;
    }
    scores.feedback = parsed.feedback || 'No feedback provided.';
    return scores;
  }

  safeParseJSON(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {}
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {}
    }
    return null;
  }

  getMockScores(competencies) {
    const out = {};
    for (const c of competencies) {
      out[c] = Math.floor(50 + Math.random() * 40);
    }
    out.feedback = 'Mock scores (Gemini API key not active).';
    return out;
  }
}

module.exports = new AIService();
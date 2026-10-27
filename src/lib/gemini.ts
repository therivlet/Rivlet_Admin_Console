/**
 * Google Gemini AI Integration Engine for Rivlet Enterprise
 * Powered by Google AI Studio
 */

const DEFAULT_MODELS = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.5-flash-lite',
];

interface GeminiOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
}

interface GeminiMultimodalOptions extends GeminiOptions {
  inlineData: {
    mimeType: string;
    data: string; // base64
  };
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }
  return key.trim();
}

/**
 * Generate text with automatic resilient model fallback
 */
export async function generateGeminiText(options: GeminiOptions): Promise<string> {
  const apiKey = getApiKey();
  const modelsToTry = options.model ? [options.model, ...DEFAULT_MODELS.filter(m => m !== options.model)] : DEFAULT_MODELS;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body: any = {
        contents: [
          {
            parts: [{ text: options.prompt }],
          },
        ],
      };

      if (options.systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      if (options.temperature !== undefined) {
        body.generationConfig = {
          temperature: options.temperature,
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.find((p: any) => typeof p.text === 'string')?.text;
      if (text !== undefined && text !== null) {
        return text;
      }
      throw new Error('Empty response from model');
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] Model ${model} failed, attempting next fallback...`, err.message);
    }
  }

  throw new Error(`All Gemini models failed: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Generate structured JSON and parse automatically into typed object
 */
export async function generateGeminiJSON<T>(options: GeminiOptions): Promise<T> {
  const jsonPrompt = `${options.prompt}\n\nIMPORTANT: Respond ONLY with a valid, raw JSON object or array. Do NOT wrap the JSON in markdown code blocks like \`\`\`json or \`\`\`. Output raw JSON characters only.`;
  const rawText = await generateGeminiText({
    ...options,
    prompt: jsonPrompt,
  });

  // Strip code fences if present
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err: any) {
    // Attempt second repair heuristic
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const slice = cleaned.slice(startIdx, endIdx + 1);
      return JSON.parse(slice) as T;
    }

    throw new Error(`Failed to parse Gemini JSON output: ${err.message}. Raw output: ${cleaned.slice(0, 200)}`);
  }
}

/**
 * Multimodal Generation (e.g. Inspecting images, tech packs, fabric labels)
 */
export async function generateGeminiMultimodal(options: GeminiMultimodalOptions): Promise<string> {
  const apiKey = getApiKey();
  const modelsToTry = options.model ? [options.model, ...DEFAULT_MODELS.filter(m => m !== options.model)] : DEFAULT_MODELS;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body: any = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: options.inlineData.mimeType,
                  data: options.inlineData.data,
                },
              },
              { text: options.prompt },
            ],
          },
        ],
      };

      if (options.systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.find((p: any) => typeof p.text === 'string')?.text;
      if (text) return text;
      throw new Error('Empty response from model');
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error(`All Gemini models failed: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Multimodal Structured JSON Extraction (e.g. Invoices, GST returns, scanned bills)
 */
export async function generateGeminiMultimodalJSON<T>(options: GeminiMultimodalOptions): Promise<T> {
  const jsonPrompt = `${options.prompt}\n\nIMPORTANT: Respond ONLY with a valid, raw JSON object. Do NOT wrap the JSON in markdown code blocks like \`\`\`json or \`\`\`. Output raw JSON characters only.`;
  const rawText = await generateGeminiMultimodal({
    ...options,
    prompt: jsonPrompt,
  });

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err: any) {
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const slice = cleaned.slice(startIdx, endIdx + 1);
      return JSON.parse(slice) as T;
    }

    throw new Error(`Failed to parse Gemini Multimodal JSON output: ${err.message}. Raw output: ${cleaned.slice(0, 200)}`);
  }
}


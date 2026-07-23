import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [googleAI()],
});

async function run() {
  console.log("Calling googleai/gemini-1.5-flash...");
  try {
    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Hello!`,
    });
    console.log("AI Output:", text);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

run();

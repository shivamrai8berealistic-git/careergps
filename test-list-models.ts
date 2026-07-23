import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [googleAI()],
});

async function run() {
  const models = await ai.registry.listModels();
  console.log("Registered models:");
  models.forEach(m => console.log(m));
}

run();

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {enableGoogleCloudTelemetry} from '@genkit-ai/google-cloud';

if (process.env.NODE_ENV === 'production') {
  enableGoogleCloudTelemetry();
}

export const ai = genkit({
  plugins: [googleAI()],
});

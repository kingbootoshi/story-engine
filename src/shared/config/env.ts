import 'dotenv/config';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Environment Variable Validation
// ---------------------------------------------------------------------------
const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().optional(),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),

  // OpenAI / Router / OpenPipe
  OPENROUTER_API_KEY: z.string(),
  OPENPIPE_API_KEY: z.string(),
});

type EnvVars = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw parsed.error;
}

export const env: EnvVars = parsed.data; 
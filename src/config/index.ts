import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(10),
});

const env = envSchema.parse(process.env);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN as string,
  },
  bcrypt: {
    rounds: env.BCRYPT_ROUNDS,
  },
};

export type Config = typeof config;
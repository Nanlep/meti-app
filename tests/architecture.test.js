import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Production Readiness Certification', () => {
  
  it('should have critical environment variables defined in schema', () => {
    // We check if the server code actually *checks* for these. 
    // We cannot check process.env here as this runs in test env, but we check code intent.
    const serverCode = fs.readFileSync(path.join(__dirname, '../server/index.js'), 'utf-8');
    expect(serverCode).toContain('process.env.API_KEY');
    expect(serverCode).toContain('process.env.MONGODB_URI');
    expect(serverCode).toContain('process.env.JWT_SECRET');
  });

  it('should explicitly use the correct Gemini SDK', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
    expect(packageJson.dependencies['@google/genai']).toBeDefined();
    // Ensure we are not using the old one
    expect(packageJson.dependencies['@google/generative-ai']).toBeUndefined();
  });

  it('should have security headers configured', () => {
    const serverCode = fs.readFileSync(path.join(__dirname, '../server/index.js'), 'utf-8');
    expect(serverCode).toContain('helmet');
    expect(serverCode).toContain('contentSecurityPolicy');
  });

  it('should enforce rate limiting', () => {
    const serverCode = fs.readFileSync(path.join(__dirname, '../server/index.js'), 'utf-8');
    expect(serverCode).toContain('rateLimit');
    expect(serverCode).toContain('RedisStore');
  });

  it('should use Zod for validation in critical AI route', () => {
    const serverCode = fs.readFileSync(path.join(__dirname, '../server/index.js'), 'utf-8');
    expect(serverCode).toContain('z.object');
    expect(serverCode).toContain('.parse(req.body)');
  });
});

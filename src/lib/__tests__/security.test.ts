/** @jest-environment node */
import { validateSameOriginRequest } from '../security';

describe('Mutation origins behind a reverse proxy', () => {
  const savedOrigin = process.env.APP_ORIGIN;
  afterEach(() => {
    if (savedOrigin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = savedOrigin;
  });

  it('accepts the configured browser origin instead of the internal server URL', () => {
    process.env.APP_ORIGIN = 'https://school.example';
    expect(validateSameOriginRequest(new Request('http://localhost:3000/api/auth/login', {
      method: 'POST', headers: { origin: 'https://school.example' },
    }))).toBeNull();
  });

  it('rejects a different origin', () => {
    process.env.APP_ORIGIN = 'https://school.example';
    expect(validateSameOriginRequest(new Request('http://localhost:3000/api/auth/login', {
      method: 'POST', headers: { origin: 'https://evil.example' },
    }))?.status).toBe(403);
  });

  it('rejects malformed referer without throwing', () => {
    expect(validateSameOriginRequest(new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST', headers: { referer: 'invalid-url' },
    }))?.status).toBe(403);
  });
});

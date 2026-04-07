import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce.js';

describe('pkce', () => {
  describe('generateCodeVerifier', () => {
    it('retorna uma string base64url (sem +, /, =)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('comprimento ≥ 43 chars (RFC 7636 §4.1 exige 43–128)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('dois chamadas sempre produzem valores diferentes', () => {
      // Probabilidade de colisão = 1/(2^256) — pode ser considerado impossível
      expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
    });
  });

  describe('generateCodeChallenge', () => {
    it('é exatamente BASE64URL(SHA256(code_verifier)) — RFC 7636 §4.2', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      const expected = createHash('sha256').update(verifier).digest('base64url');
      expect(challenge).toBe(expected);
    });

    it('retorna somente caracteres base64url', () => {
      const challenge = generateCodeChallenge(generateCodeVerifier());
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('verifiers diferentes produzem challenges diferentes', () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(generateCodeChallenge(v1)).not.toBe(generateCodeChallenge(v2));
    });

    it('o mesmo verifier sempre produz o mesmo challenge (determinístico)', () => {
      const verifier = 'valor-fixo-de-teste';
      expect(generateCodeChallenge(verifier)).toBe(generateCodeChallenge(verifier));
    });
  });

  describe('generateState', () => {
    it('retorna uma string base64url', () => {
      expect(generateState()).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('dois chamadas sempre produzem valores diferentes', () => {
      expect(generateState()).not.toBe(generateState());
    });

    it('comprimento adequado para proteção anti-CSRF (≥ 16 chars)', () => {
      // 16 bytes → 22 chars base64url — entropia suficiente para anti-CSRF
      expect(generateState().length).toBeGreaterThanOrEqual(16);
    });
  });
});

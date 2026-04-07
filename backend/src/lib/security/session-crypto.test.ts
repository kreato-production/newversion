import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decryptToken, encryptToken, sessionSecretToKey } from './session-crypto.js';

// Chave determinística para os testes (32 bytes de 0x42)
const TEST_KEY = Buffer.alloc(32, 0x42);

describe('session-crypto', () => {
  describe('encryptToken / decryptToken', () => {
    it('round-trip: decrypt(encrypt(x)) === x', () => {
      const plaintext = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.exemplo-de-token';
      const encrypted = encryptToken(TEST_KEY, plaintext);
      expect(decryptToken(TEST_KEY, encrypted)).toBe(plaintext);
    });

    it('preserva strings vazias', () => {
      expect(decryptToken(TEST_KEY, encryptToken(TEST_KEY, ''))).toBe('');
    });

    it('preserva strings longas (token JWT real)', () => {
      const longToken = 'a'.repeat(2048);
      expect(decryptToken(TEST_KEY, encryptToken(TEST_KEY, longToken))).toBe(longToken);
    });

    it('o valor encriptado não contém o plaintext', () => {
      const plaintext = 'segredo-muito-importante';
      const encrypted = encryptToken(TEST_KEY, plaintext);
      expect(encrypted).not.toContain(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('duas encriptações do mesmo valor produzem ciphertexts diferentes (IV único)', () => {
      const plaintext = 'mesmo-token';
      const enc1 = encryptToken(TEST_KEY, plaintext);
      const enc2 = encryptToken(TEST_KEY, plaintext);
      // IVs aleatórios garantem outputs diferentes — propriedade essencial do GCM
      expect(enc1).not.toBe(enc2);
      // Mas ambos decriptam para o mesmo valor
      expect(decryptToken(TEST_KEY, enc1)).toBe(plaintext);
      expect(decryptToken(TEST_KEY, enc2)).toBe(plaintext);
    });

    it('formato de saída é iv:authTag:ciphertext com tamanhos corretos', () => {
      const encrypted = encryptToken(TEST_KEY, 'test');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(24);   // IV: 12 bytes × 2 hex chars = 24
      expect(parts[1]).toHaveLength(32);   // Auth tag: 16 bytes × 2 hex chars = 32
      // ciphertext tem comprimento variável >= 2 chars hex
      expect(parts[2].length).toBeGreaterThanOrEqual(2);
    });

    it('detecta adulteração no ciphertext (auth tag mismatch)', () => {
      const encrypted = encryptToken(TEST_KEY, 'valor-original');
      const [iv, tag, data] = encrypted.split(':');
      // Altera um byte no final do ciphertext
      const tampered = `${iv}:${tag}:${data.slice(0, -2)}ff`;
      expect(() => decryptToken(TEST_KEY, tampered)).toThrow();
    });

    it('detecta adulteração no auth tag', () => {
      const encrypted = encryptToken(TEST_KEY, 'valor-original');
      const [iv, tag, data] = encrypted.split(':');
      // Inverte o primeiro byte do auth tag
      const flippedTag = (parseInt(tag.slice(0, 2), 16) ^ 0xff).toString(16).padStart(2, '0') + tag.slice(2);
      expect(() => decryptToken(TEST_KEY, `${iv}:${flippedTag}:${data}`)).toThrow();
    });

    it('rejeita formato inválido (menos de 3 segmentos)', () => {
      expect(() => decryptToken(TEST_KEY, 'formato-invalido')).toThrow(
        'Ciphertext em formato inválido',
      );
    });

    it('falha com chave diferente da usada na encriptação', () => {
      const encrypted = encryptToken(TEST_KEY, 'conteudo');
      const wrongKey = Buffer.alloc(32, 0x99);
      expect(() => decryptToken(wrongKey, encrypted)).toThrow();
    });
  });

  describe('sessionSecretToKey', () => {
    it('converte 64 chars hex em Buffer de 32 bytes', () => {
      const secret = 'a'.repeat(64);
      const key = sessionSecretToKey(secret);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.byteLength).toBe(32);
    });

    it('o valor do Buffer corresponde ao hex decodificado', () => {
      const secret = '0'.repeat(62) + 'ff'; // 62 zeros + 'ff'
      const key = sessionSecretToKey(secret);
      expect(key[31]).toBe(0xff);
      expect(key[0]).toBe(0x00);
    });

    it('rejeita secret com menos de 64 chars', () => {
      expect(() => sessionSecretToKey('abc123')).toThrow();
    });

    it('rejeita secret com caracteres não-hexadecimais', () => {
      // 'z' não é hex
      expect(() => sessionSecretToKey('z'.repeat(64))).toThrow();
    });

    it('aceita letras maiúsculas e minúsculas em hex', () => {
      const lower = 'abcdef0123456789'.repeat(4);
      const upper = 'ABCDEF0123456789'.repeat(4);
      expect(sessionSecretToKey(lower).byteLength).toBe(32);
      expect(sessionSecretToKey(upper).byteLength).toBe(32);
      // Ambos produzem a mesma chave
      expect(sessionSecretToKey(lower)).toEqual(sessionSecretToKey(upper));
    });
  });
});

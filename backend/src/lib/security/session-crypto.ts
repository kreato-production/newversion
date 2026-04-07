/**
 * Criptografia simétrica para tokens armazenados em banco de dados.
 *
 * Algoritmo: AES-256-GCM
 *  - Confidencialidade: o conteúdo é ilegível sem a chave
 *  - Autenticidade: o authTag detecta qualquer adulteração no ciphertext
 *  - IV único por operação: mesmo texto igual gera ciphertexts diferentes
 *
 * A chave deve ser 32 bytes (derivada de SESSION_SECRET como hex de 64 chars).
 *
 * Formato da saída: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 * Os três campos são separados por ":" e decodificados como hex no decrypt.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;   // Tamanho recomendado para GCM
const TAG_BYTES = 16;  // Tamanho padrão do GCM auth tag

/**
 * Criptografa `plaintext` com a chave fornecida.
 * @param key   Buffer de 32 bytes (AES-256)
 * @param plaintext  String UTF-8 a ser criptografada
 * @returns Ciphertext no formato "iv:tag:dados" (hex)
 */
export function encryptToken(key: Buffer, plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Descriptografa um ciphertext produzido por `encryptToken`.
 * Lança erro se a chave estiver errada ou o ciphertext tiver sido adulterado.
 * @param key        Buffer de 32 bytes (AES-256)
 * @param ciphertext No formato "iv:tag:dados" (hex)
 */
export function decryptToken(key: Buffer, ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Ciphertext em formato inválido (esperado iv:tag:dados)');
  }

  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');
}

/** Converte SESSION_SECRET (hex string de 64 chars) em Buffer de 32 bytes. */
export function sessionSecretToKey(secret: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(secret)) {
    throw new Error('SESSION_SECRET inválido: deve ser 64 caracteres hexadecimais');
  }
  return Buffer.from(secret, 'hex');
}

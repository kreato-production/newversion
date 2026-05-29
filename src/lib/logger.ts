/**
 * Logger estruturado para código server-side do Next.js.
 *
 * Produção → JSON em stdout (compatível com DataDog, Loki, CloudWatch, etc.)
 * Desenvolvimento → saída legível no console
 * Test → silencioso
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_TEST = process.env.NODE_ENV === 'test';

function emit(level: LogLevel, meta: LogMeta, msg: string): void {
  if (IS_TEST) return;

  if (IS_PROD) {
    process.stdout.write(
      JSON.stringify({ level, msg, ...meta, time: new Date().toISOString() }) + '\n',
    );
    return;
  }

  const prefix = `[${level.toUpperCase()}]`;
  const metaStr = Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
  const line = `${prefix} ${msg}${metaStr}`;

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (meta: LogMeta, msg: string) => emit('debug', meta, msg),
  info: (meta: LogMeta, msg: string) => emit('info', meta, msg),
  warn: (meta: LogMeta, msg: string) => emit('warn', meta, msg),
  error: (meta: LogMeta, msg: string) => emit('error', meta, msg),
};

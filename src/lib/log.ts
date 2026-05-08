import pc from 'picocolors';

type Level = 'info' | 'success' | 'warn' | 'error' | 'step' | 'dim';

const PREFIX: Record<Level, string> = {
  info: pc.blue('ℹ'),
  success: pc.green('✔'),
  warn: pc.yellow('⚠'),
  error: pc.red('✖'),
  step: pc.cyan('▸'),
  dim: pc.dim('·'),
};

function write(level: Level, message: string): void {
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(`${PREFIX[level]} ${message}\n`);
}

export const log = {
  info: (msg: string) => write('info', msg),
  success: (msg: string) => write('success', msg),
  warn: (msg: string) => write('warn', msg),
  error: (msg: string) => write('error', msg),
  step: (msg: string) => write('step', pc.bold(msg)),
  dim: (msg: string) => write('dim', pc.dim(msg)),
  blank: () => process.stdout.write('\n'),
  raw: (msg: string) => process.stdout.write(`${msg}\n`),
};

export const colors = pc;

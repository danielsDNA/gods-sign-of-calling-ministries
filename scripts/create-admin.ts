import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline';
import { db, closeConnection } from '../src/server/db/supabase-client.js';
import { adminUsers } from '../src/server/db/schema.js';

function readHidden(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return Promise.reject(new Error('Run this command in an interactive terminal.'));
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const input: string[] = [];
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();

    const finish = (error?: Error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(input.join(''));
    };

    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') return finish(new Error('Admin creation cancelled.'));
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u007f' || char === '\b') input.pop();
        else input.push(char);
      }
    };

    stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = (process.argv[2] || await terminal.question('Admin email: ')).trim().toLowerCase();
    terminal.close();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');

    const password = await readHidden('Password (minimum 8 characters): ');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    const confirmation = await readHidden('Confirm password: ');
    if (password !== confirmation) throw new Error('Passwords do not match.');

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.insert(adminUsers).values({
      email,
      passwordHash,
      role: 'owner',
    }).returning({ id: adminUsers.id });
    process.stdout.write(`Created admin account ${email} (id ${result.id}).\n`);
  } finally {
    terminal.close();
    await closeConnection();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Admin creation failed.');
  process.exitCode = 1;
});

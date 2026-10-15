import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
const rl = createInterface({ input: stdin, output: stdout });
try {
  const username = process.env.NPIUM_ADMIN_USERNAME || await rl.question('관리자 계정 ID: ');
  const name = process.env.NPIUM_ADMIN_NAME || await rl.question('관리자 이름: ');
  let password = process.env.NPIUM_ADMIN_PASSWORD;
  if (!password && stdin.isTTY) {
    rl.close();
    stdout.write('비밀번호 (12자 이상, 입력 내용 숨김): ');
    stdin.setRawMode(true); password = '';
    await new Promise(resolve => { const onData = data => { for (const c of data.toString()) { if (c === '\r' || c === '\n') { stdin.off('data', onData); stdin.setRawMode(false); stdout.write('\n'); resolve(); return; } if (c === '\u0003') { stdin.setRawMode(false); process.exit(1); } if (c === '\u007f' || c === '\b') password = password.slice(0, -1); else password += c; } }; stdin.on('data', onData); stdin.resume(); });
  }
  if (!/^[a-zA-Z0-9._-]{3,80}$/.test(username) || !name?.trim() || !password || password.length < 12 || password.length > 128) throw new Error('계정 ID·이름·비밀번호(12~128자)를 확인해 주세요.');
  const file = resolve(process.env.NPIUM_DB_PATH || '.local/npium.sqlite'); mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file); db.exec("CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, organization TEXT NOT NULL DEFAULT '', providerId TEXT NOT NULL DEFAULT '', salt TEXT NOT NULL, hash TEXT NOT NULL, disabled INTEGER NOT NULL DEFAULT 0)");
  const salt = randomBytes(16).toString('hex');
  db.prepare('INSERT INTO accounts(id,username,name,role,salt,hash) VALUES(?,?,?,?,?,?)').run(randomUUID(), username, name.trim(), 'admin', salt, scryptSync(password, salt, 64).toString('hex')); db.close();
  console.log('관리자 계정을 생성했습니다. 기존 계정은 덮어쓰지 않습니다.');
} catch (e) { console.error(e.code === 'ERR_SQLITE_ERROR' ? '이미 있는 계정이거나 DB를 열 수 없습니다.' : e.message); process.exitCode = 1; } finally { rl.close(); }

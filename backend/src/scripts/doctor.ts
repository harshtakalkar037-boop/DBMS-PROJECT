/**
 * npm run db:doctor
 *
 * Answers "why can't the API reach my database?" in one shot.
 *
 * It separates the three failure modes that all look like "the API won't start":
 *   1. nothing is listening on host:port        → the server is not installed/running
 *   2. TCP is open but login is refused         → wrong user/password or auth plugin
 *   3. login works but the database is missing  → schema not loaded yet
 *
 * For each one it prints the exact next command for Linux (systemd), macOS
 * (Homebrew) and Docker.
 */
import net from 'net';
import mysql from 'mysql2/promise';
import { env } from '../config/env';
import { pool, query, Row } from '../config/database';

const { host, port, user, database, socketPath } = env.db;

const line = (s = '') => process.stdout.write(`${s}\n`);
const rule = () => line('─'.repeat(72));

function tcpProbe(hostToTest: string, portToTest: number, ms = 2500): Promise<string | null> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: hostToTest, port: portToTest });
    const done = (err: string | null) => {
      socket.destroy();
      resolve(err);
    };
    socket.setTimeout(ms);
    socket.once('connect', () => done(null));
    socket.once('timeout', () => done('ETIMEDOUT'));
    socket.once('error', (e: NodeJS.ErrnoException) => done(e.code ?? e.message));
  });
}

async function main(): Promise<void> {
  line();
  line('  University ERP — database doctor');
  rule();
  line(`  target   : ${user}@${socketPath ? `socket ${socketPath}` : `${host}:${port}`}/${database}`);
  line(`  password : ${env.db.password ? 'set (from .env)' : 'empty'}`);
  line();

  /* ------------------------------------------------ 1. is anything listening? */
  // A socket connection needs no TCP listener, so only probe when using TCP.
  const err = socketPath ? null : await tcpProbe(host, port);
  if (err) {
    line(`  RESULT   : nothing is listening on ${host}:${port}  (${err})`);
    line();
    line('  The database SERVER is not running. Fix that first:');
    line();
    line('    macOS (Homebrew, MySQL)     : brew install mysql && brew services start mysql');
    line('    macOS (Homebrew, MariaDB)   : brew install mariadb && brew services start mariadb');
    line('    Debian/Ubuntu               : sudo apt-get install -y mariadb-server && sudo systemctl start mariadb');
    line('    Fedora/RHEL                 : sudo dnf install -y mariadb-server && sudo systemctl start mariadb');
    line('    Docker (no local install)   : docker compose up -d db');
    line();
    line('  The server answers on a Unix socket but not on TCP? Skip TCP entirely:');
    line('    mysql -u root -e "SHOW VARIABLES LIKE \'socket\';"');
    line('    then put that path in backend/.env as  DB_SOCKET_PATH=/tmp/mysql.sock');
    line();
    line('  then confirm with:');
    if (process.platform === 'darwin') {
      line('    brew services list | grep -i -E "mysql|mariadb"');
      line('    mysql -u root -h 127.0.0.1 -P 3306 -e "SELECT VERSION();"');
    } else {
      line('    sudo systemctl status mariadb --no-pager');
      line('    mariadb -u root -e "SELECT VERSION();"');
    }
    line('    npm run db:doctor        # run this again');
    line();
    process.exitCode = 1;
    return;
  }
  line(socketPath
    ? `  network  : using Unix socket ${socketPath} (TCP not required)`
    : `  network  : something IS listening on ${host}:${port}`);

  /* ---------------------------------------------- 2. can we log in at all? */
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host, port, user, password: env.db.password,
      connectTimeout: 4000,
    });
    const [v] = await conn.query('SELECT VERSION() AS v');
    const version = (v as Array<{ v: string }>)[0]?.v ?? 'unknown';
    line(`  login    : OK  (server ${version})`);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException & { code?: string }).code ?? '';
    const msg = e instanceof Error ? e.message : String(e);
    line(`  login    : FAILED  [${code}] ${msg.split('\n')[0]}`);
    line();
    if (code === 'ER_ACCESS_DENIED_ERROR' || code === 'ER_NOT_SUPPORTED_AUTH_MODE') {
      line('  The server is up but it rejected these credentials. Try:');
      line();
      line(`    1) log in as the server admin and create the user the app expects:`);
      line(`         mysql -u root -p`);
      line(`         CREATE USER '${user}'@'%' IDENTIFIED WITH mysql_native_password BY 'erp_pass_2026';`);
      line(`         GRANT ALL PRIVILEGES ON \`${database}\`.* TO '${user}'@'%';`);
      line(`         FLUSH PRIVILEGES;`);
      line();
      line('    2) or point .env at a login that already works, for example Homebrew MySQL root:');
      line('         DB_USER=root');
      line('         DB_PASSWORD=');
      line();
      line('    3) or reset the root password you forgot:');
      line('         brew services stop mysql && mysqld_safe --skip-grant-tables');
    } else {
      line(`  Unexpected error: ${msg}`);
    }
    line();
    process.exitCode = 1;
    return;
  } finally {
    if (conn) await conn.end();
  }

  /* --------------------------------------- 3. does the database exist / loaded? */
  try {
    const [dbs] = await query<Row>(
      `SELECT COUNT(*) AS n FROM information_schema.tables
       WHERE table_schema = ? AND table_type = 'BASE TABLE'`, [database],
    );
    const tables = Number((dbs as Row)?.n ?? 0);
    line(`  database : '${database}' exists with ${tables} tables`);
    line();
    if (tables < 40) {
      line('  The schema is NOT loaded (a full install has 61 tables). Run:');
      line();
      line('    npm run db:reset      # creates the database and loads schema + demo data');
      line();
      process.exitCode = 1;
      return;
    }
    const [counts] = await query<Row>(
      `SELECT (SELECT COUNT(*) FROM students) AS students,
              (SELECT COUNT(*) FROM faculty)  AS faculty,
              (SELECT COUNT(*) FROM attendance) AS attendance`,
    );
    line(`  data     : ${JSON.stringify(counts)}`);
    if (Number((counts as Row)?.students ?? 0) === 0) {
      line();
      line('  Schema is loaded but there is no data yet:  npm run db:reset   (or npm run db:seed)');
      process.exitCode = 1;
      return;
    }
    rule();
    line('  Everything looks good. Next:');
    line('    npm run db:verify     # 10 consistency checks');
    line('    npm run dev           # start the API on http://localhost:8080');
    line();
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (code === 'ER_BAD_DB_ERROR') {
      line(`  database : '${database}' does not exist yet.`);
      line();
      line('    npm run db:reset      # creates it and loads schema + demo data');
    } else {
      line(`  database : query failed — ${e instanceof Error ? e.message : e}`);
    }
    line();
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    line(`  doctor crashed: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    // the mysql2 pool keeps the event loop alive — close it so `npm run db:doctor`
    // returns to the shell immediately instead of idling on open sockets
    await pool.end().catch(() => undefined);
    process.exit(process.exitCode ?? 0);
  });

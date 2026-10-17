#!/usr/bin/env node
/**
 * mysql-socket-proxy.mjs — make a socket-only MySQL/MariaDB server reachable on TCP.
 *
 * WHY THIS EXISTS
 *   On macOS (and some Linux distros) the database server is often started so that
 *   `mysql -u root` works — over the Unix socket — while nothing listens on TCP:
 *
 *       $ mysql -u root -e "SELECT 1"                       # works
 *       $ mysql -u root -h 127.0.0.1 -P 3306 -e "SELECT 1"  # ERROR 2003 (61)
 *
 *   Node drivers (mysql2) can use a socket, but tooling, GUIs and ORMs usually want
 *   TCP. This proxy listens on 127.0.0.1:3306 and pipes every connection straight
 *   into the server's Unix socket — no configuration files, no server restart, no
 *   extra packages. The MySQL wire protocol is untouched; we only move bytes.
 *
 * USAGE
 *   node scripts/mysql-socket-proxy.mjs                 # auto-detect the socket
 *   node scripts/mysql-socket-proxy.mjs /tmp/mysql.sock # explicit socket
 *   PORT=3307 SOCKET=/tmp/mysql.sock node scripts/mysql-socket-proxy.mjs
 *
 * Leave it running in a spare terminal while you work (Ctrl+C to stop).
 */
import net from 'net';
import fs from 'fs';

const PORT = Number(process.env.PORT ?? 3306);
const HOST = process.env.HOST ?? '127.0.0.1';

/** Where each platform/installer usually keeps the socket. */
const CANDIDATES = [
  process.env.SOCKET,
  process.argv[2],
  '/tmp/mysql.sock',
  '/opt/homebrew/var/mysql/mysql.sock',                  // Homebrew on Apple Silicon
  '/opt/homebrew/var/run/mysqld/mysqld.sock',            // Homebrew MariaDB (Apple Silicon)
  '/usr/local/var/mysql/mysql.sock',                     // Homebrew on Intel Mac
  '/usr/local/var/run/mysqld/mysqld.sock',               // Homebrew MariaDB (Intel Mac)
  '/opt/homebrew/var/lib/mysql/mysql.sock',
  '/var/run/mysqld/mysqld.sock',                         // Debian/Ubuntu
  '/var/lib/mysql/mysql.sock',                           // RHEL/Fedora
  '/run/mysqld/mysqld.sock',
  '/var/mysql/mysql.sock',                               // official Oracle packages
].filter(Boolean);

const socket = CANDIDATES.find((p) => {
  try {
    return fs.statSync(p).isSocket();
  } catch {
    return false;
  }
});

if (!socket) {
  console.error('Could not find a MySQL socket. Tried:\n  ' + CANDIDATES.join('\n  '));
  console.error('\nFind it with:  mysql -u root -e "SHOW VARIABLES LIKE \'socket\';"');
  console.error('then run:      SOCKET=/that/path node scripts/mysql-socket-proxy.mjs');
  process.exit(1);
}

const server = net.createServer((client) => {
  const upstream = net.connect(socket);
  client.pipe(upstream).pipe(client);
  const kill = (who) => (err) => {
    if (err) process.stdout.write(`  [proxy] ${who}: ${err.code ?? err.message}\n`);
    client.destroy();
    upstream.destroy();
  };
  client.on('error', kill('client'));
  upstream.on('error', kill('server'));
  client.on('close', () => upstream.destroy());
  upstream.on('close', () => client.destroy());
});

server.on('error', (e) => {
  console.error(`Cannot listen on ${HOST}:${PORT} — ${e.code ?? e.message}`);
  if (e.code === 'EADDRINUSE') {
    console.error('Something is already on that port — that is fine, you do not need this proxy.');
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`  MySQL socket proxy`);
  console.log(`    listening : tcp://${HOST}:${PORT}`);
  console.log(`    forwarding: unix://${socket}`);
  console.log(`  Leave this running. Test with:`);
  console.log(`    mysql -u root -h ${HOST} -P ${PORT} -e "SELECT VERSION();"`);
  console.log(`    npm run db:doctor   (from backend/)`);
  console.log('  Ctrl+C to stop.');
});

#!/bin/sh
set -e

echo "[entrypoint] Waiting for PostgreSQL to accept TCP connections..."
until node -e "
  const net = require('net');
  const client = new net.Socket();
  client.on('error', () => { client.destroy(); process.exit(1); });
  client.connect(5432, 'postgres', () => { client.destroy(); process.exit(0); });
  setTimeout(() => { client.destroy(); process.exit(1); }, 3000);
" 2>/dev/null; do
  echo "    still waiting..."
  sleep 2
done
echo "[entrypoint] PostgreSQL is reachable."

if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  npx prisma migrate deploy
else
  echo "[entrypoint] No migrations found, using prisma db push..."
  npx prisma db push
fi

echo "[entrypoint] Starting NestJS on port ${PORT:-3000}..."
exec node dist/main

#!/bin/bash
export PORT=3000
export NODE_ENV=production
export DATABASE_URL="file:./dev.db"
cd "$(dirname "$0")"
npx next start

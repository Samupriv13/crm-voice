#!/bin/sh
echo "DATABASE_URL is set: $(echo $DATABASE_URL | cut -c1-20)..."
npx prisma db push --accept-data-loss
node src/index.js

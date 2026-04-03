#!/bin/sh
echo "Starting CRM Voice Backend..."
echo "DATABASE_URL prefix: $(echo $DATABASE_URL | cut -c1-15)..."
export DATABASE_URL=$DATABASE_URL
npx prisma db push --accept-data-loss
node src/index.js

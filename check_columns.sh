#!/bin/bash
docker exec -i uyv3qfxqzeum3yavomg0juac psql -U postgres -d postgres -c "SELECT column_name FROM information_schema.columns WHERE table_name = '__EFMigrationsHistory';"

#!/bin/bash
HASH=$(docker exec coolify php -r 'echo password_hash("Ultrapie2026!", PASSWORD_BCRYPT);')
docker exec -i coolify-db psql -U coolify -d coolify -c "UPDATE users SET password = '$HASH' WHERE id = 0;"
echo "Coolify credentials reset successfully for root user!"
docker exec -i coolify-db psql -U coolify -d coolify -c "SELECT id, name, email FROM users WHERE id = 0;"

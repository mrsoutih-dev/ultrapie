#!/bin/bash
set -e

echo "=== Coolify Password Reset & Verification Script ==="

# 1. Inspect user in Coolify using Laravel Artisan
sudo docker exec coolify php artisan tinker --execute='
$u = App\Models\User::find(0);
if ($u) {
    echo "Found user: " . $u->name . " (" . $u->email . ")\n";
    $u->password = Hash::make("Ultrapie2026!");
    $u->email_verified_at = now();
    $u->save();
    echo "Password successfully set via Hash::make for Ultrapie2026!\n";
    echo "Verification check: " . (Hash::check("Ultrapie2026!", $u->password) ? "VALID" : "INVALID") . "\n";
} else {
    echo "User 0 not found!\n";
}
'

# 2. Check if registration is disabled or settings table has restrictions
sudo docker exec coolify-db psql -U coolify -d coolify -c "SELECT id, name, email, email_verified_at FROM users;"

echo "=== Done ==="

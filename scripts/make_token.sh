docker exec coolify php artisan tinker --execute='
$u = App\Models\User::find(0);
$plain = Illuminate\Support\Str::random(40);
$t = $u->tokens()->create([
    "name" => "ultrapie-api-token",
    "token" => hash("sha256", $plain),
    "abilities" => ["*"],
    "team_id" => 0
]);
echo "COOLIFY_REAL_API_TOKEN:" . $t->id . "|" . $plain . "\n";
'

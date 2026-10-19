<?php
declare(strict_types=1);
require dirname(__DIR__) . '/lib/bootstrap.php';

$pdo = db();
$pdo->exec('DELETE FROM statuses WHERE expires_at < ?', [now()]);
$pdo->exec('DELETE FROM live_locations WHERE expires_at < ?', [now()]);
$pdo->exec('DELETE FROM typing WHERE until_at < ?', [now()]);
$old = gmdate('Y-m-d H:i:s', time() - 86400);
$chunks = $pdo->all('SELECT id FROM uploads WHERE done = 0 AND created_at < ?', [$old]);
foreach ($chunks as $row) {
    $part = dirname(__DIR__) . '/storage/chunks/' . $row['id'] . '.part';
    if (is_file($part)) {
        unlink($part);
    }
    $pdo->exec('DELETE FROM uploads WHERE id = ?', [$row['id']]);
}

write_backup(false);
echo "ok\n";

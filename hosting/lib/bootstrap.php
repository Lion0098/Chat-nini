<?php
declare(strict_types=1);

const APP_NAME = 'chat-nini';

if (empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $alt = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_X_AUTH'] ?? '';
    if ($alt !== '') {
        $_SERVER['HTTP_AUTHORIZATION'] = str_starts_with($alt, 'Bearer ') ? $alt : ('Bearer ' . $alt);
    }
}

function app_root(): string
{
    return dirname(__DIR__);
}

function cfg(): array
{
    static $cfg;
    if ($cfg) {
        return $cfg;
    }
    $path = app_root() . '/config.php';
    if (!is_file($path)) {
        $key = bin2hex(random_bytes(32));
        $php = "<?php\nreturn " . var_export([
            'debug' => false,
            'driver' => 'sqlite',
            'sqlite' => app_root() . '/storage/app.sqlite',
            'mysql' => ['host' => 'localhost', 'port' => 3306, 'name' => '', 'user' => '', 'pass' => ''],
            'key' => $key,
        ], true) . ";\n";
        if (!is_dir(app_root() . '/storage')) {
            mkdir(app_root() . '/storage', 0775, true);
        }
        file_put_contents($path, $php, LOCK_EX);
    }
    $cfg = require $path;
    $cfg['debug'] = getenv('CHATNINI_DEBUG') === '1' || !empty($cfg['debug']);
    return $cfg;
}

function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $error, int $status = 400): never
{
    json_out(['ok' => false, 'error' => $error], $status);
}

function ok(mixed $data = null): never
{
    json_out(['ok' => true, 'data' => $data]);
}

function body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function clean(mixed $value, int $max): string
{
    $text = trim(str_replace("\0", '', (string) ($value ?? '')));
    if (mb_strlen($text) > $max) {
        $text = mb_substr($text, 0, $max);
    }
    return $text;
}

function now(): string
{
    return gmdate('Y-m-d H:i:s');
}

function client_ip(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 64);
}

final class DB
{
    public string $driver;
    private \SQLite3|\PDO $h;

    public function __construct(string $driver, \SQLite3|\PDO $h)
    {
        $this->driver = $driver;
        $this->h = $h;
    }

    public static function connect(array $cfg): self
    {
        if (($cfg['driver'] ?? 'sqlite') === 'mysql') {
            $m = $cfg['mysql'];
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $m['host'], (int) ($m['port'] ?? 3306), $m['name']);
            $pdo = new PDO($dsn, $m['user'], $m['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            return new self('mysql', $pdo);
        }
        $path = $cfg['sqlite'];
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $sq = new SQLite3($path);
        $sq->enableExceptions(true);
        $sq->busyTimeout(4000);
        $sq->exec('PRAGMA foreign_keys = ON');
        return new self('sqlite', $sq);
    }

    public function exec(string $sql, array $params = []): void
    {
        $this->run($sql, $params, false);
    }

    public function all(string $sql, array $params = []): array
    {
        return $this->run($sql, $params, true);
    }

    public function one(string $sql, array $params = []): ?array
    {
        $rows = $this->all($sql, $params);
        return $rows[0] ?? null;
    }

    public function insert(string $sql, array $params = []): int
    {
        $this->exec($sql, $params);
        if ($this->h instanceof SQLite3) {
            return (int) $this->h->lastInsertRowID();
        }
        return (int) $this->h->lastInsertId();
    }

    private function run(string $sql, array $params, bool $rows): array
    {
        if ($this->h instanceof SQLite3) {
            $stmt = $this->h->prepare($sql);
            foreach (array_values($params) as $i => $value) {
                $type = SQLITE3_TEXT;
                if (is_int($value)) {
                    $type = SQLITE3_INTEGER;
                } elseif (is_null($value)) {
                    $type = SQLITE3_NULL;
                }
                $stmt->bindValue($i + 1, $value, $type);
            }
            $result = $stmt->execute();
            if (!$rows) {
                return [];
            }
            $out = [];
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $out[] = $row;
            }
            return $out;
        }
        $stmt = $this->h->prepare($sql);
        $stmt->execute(array_values($params));
        if (!$rows) {
            return [];
        }
        return $stmt->fetchAll();
    }
}

function db(): DB
{
    static $db;
    if (!$db) {
        $db = DB::connect(cfg());
        migrate($db);
    }
    return $db;
}

function id_sql(DB $db): string
{
    return $db->driver === 'mysql' ? 'INT PRIMARY KEY AUTO_INCREMENT' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
}

function migrate(DB $db): void
{
    $id = id_sql($db);
    $engine = $db->driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4' : '';
    $stmts = [
        "CREATE TABLE IF NOT EXISTS users (
            id $id,
            email VARCHAR(190) NULL,
            phone VARCHAR(20) NULL,
            username VARCHAR(24) NULL,
            password_hash VARCHAR(255) NOT NULL,
            display_name VARCHAR(80) NOT NULL,
            about VARCHAR(255) NOT NULL DEFAULT '',
            avatar_file VARCHAR(64) NULL,
            role VARCHAR(16) NOT NULL DEFAULT 'user',
            locale VARCHAR(8) NOT NULL DEFAULT 'fa',
            theme VARCHAR(8) NOT NULL DEFAULT 'light',
            privacy_last_seen VARCHAR(16) NOT NULL DEFAULT 'everyone',
            privacy_photo VARCHAR(16) NOT NULL DEFAULT 'everyone',
            privacy_about VARCHAR(16) NOT NULL DEFAULT 'everyone',
            privacy_status VARCHAR(16) NOT NULL DEFAULT 'contacts',
            hide_online INTEGER NOT NULL DEFAULT 0,
            share_typing INTEGER NOT NULL DEFAULT 1,
            read_receipts INTEGER NOT NULL DEFAULT 1,
            notif_sound INTEGER NOT NULL DEFAULT 1,
            two_factor INTEGER NOT NULL DEFAULT 0,
            token_version INTEGER NOT NULL DEFAULT 1,
            suspended INTEGER NOT NULL DEFAULT 0,
            last_seen_at TEXT NULL,
            created_at TEXT NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS password_resets (
            id $id, user_id INTEGER NOT NULL, token_hash TEXT NOT NULL, expires_at TEXT NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS login_challenges (
            id $id, user_id INTEGER NOT NULL, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS contacts (
            owner_id INTEGER NOT NULL, contact_id INTEGER NOT NULL, created_at TEXT NOT NULL,
            PRIMARY KEY (owner_id, contact_id)
        )$engine",
        "CREATE TABLE IF NOT EXISTS blocks (
            blocker_id INTEGER NOT NULL, blocked_id INTEGER NOT NULL, created_at TEXT NOT NULL,
            PRIMARY KEY (blocker_id, blocked_id)
        )$engine",
        "CREATE TABLE IF NOT EXISTS reports (
            id $id, reporter_id INTEGER NOT NULL, target_user_id INTEGER NULL,
            target_message_id INTEGER NULL, reason TEXT NOT NULL, details TEXT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'open', created_at TEXT NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS chats (
            id $id, kind VARCHAR(16) NOT NULL, title VARCHAR(80) NULL, about VARCHAR(255) NOT NULL DEFAULT '',
            avatar_file VARCHAR(64) NULL, pinned_message_id INTEGER NULL, created_by INTEGER NOT NULL,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS chat_members (
            chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL, role VARCHAR(16) NOT NULL DEFAULT 'member',
            muted INTEGER NOT NULL DEFAULT 0, pinned INTEGER NOT NULL DEFAULT 0,
            archived INTEGER NOT NULL DEFAULT 0, unread_mark INTEGER NOT NULL DEFAULT 0,
            cleared_at TEXT NULL, hidden_at TEXT NULL, last_read_at TEXT NULL,
            joined_at TEXT NOT NULL, PRIMARY KEY (chat_id, user_id)
        )$engine",
        "CREATE TABLE IF NOT EXISTS messages (
            id $id, chat_id INTEGER NOT NULL, sender_id INTEGER NOT NULL, kind TEXT NOT NULL,
            payload TEXT NULL, reply_to INTEGER NULL, forwarded INTEGER NOT NULL DEFAULT 0,
            file_id TEXT NULL, file_name TEXT NULL, file_mime TEXT NULL, file_size INTEGER NULL,
            created_at TEXT NOT NULL, edited_at TEXT NULL, deleted_at TEXT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS message_hides (
            message_id INTEGER NOT NULL, user_id INTEGER NOT NULL, PRIMARY KEY (message_id, user_id)
        )$engine",
        "CREATE TABLE IF NOT EXISTS message_receipts (
            message_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
            delivered_at TEXT NULL, read_at TEXT NULL, PRIMARY KEY (message_id, user_id)
        )$engine",
        "CREATE TABLE IF NOT EXISTS typing (
            chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL, kind TEXT NOT NULL, until_at TEXT NOT NULL,
            PRIMARY KEY (chat_id, user_id)
        )$engine",
        "CREATE TABLE IF NOT EXISTS statuses (
            id $id, user_id INTEGER NOT NULL, kind TEXT NOT NULL, caption TEXT NULL, bg TEXT NULL,
            file_id TEXT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS status_views (
            status_id INTEGER NOT NULL, viewer_id INTEGER NOT NULL, viewed_at TEXT NOT NULL,
            PRIMARY KEY (status_id, viewer_id)
        )$engine",
        "CREATE TABLE IF NOT EXISTS live_locations (
            message_id INTEGER PRIMARY KEY, lat REAL NOT NULL, lng REAL NOT NULL,
            expires_at TEXT NOT NULL, updated_at TEXT NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS uploads (
            id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL,
            size INTEGER NOT NULL, received INTEGER NOT NULL DEFAULT 0, done INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS rate_limits (
            rk TEXT PRIMARY KEY, window_start INTEGER NOT NULL, hits INTEGER NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS push_subs (
            id $id, user_id INTEGER NOT NULL, endpoint TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
            created_at TEXT NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS notifications (
            id $id, user_id INTEGER NOT NULL, chat_id INTEGER NULL, title TEXT NOT NULL,
            body TEXT NOT NULL, created_at TEXT NOT NULL, seen INTEGER NOT NULL DEFAULT 0
        )$engine",
        "CREATE TABLE IF NOT EXISTS settings (skey TEXT PRIMARY KEY, svalue TEXT NOT NULL)$engine",
    ];
    foreach ($stmts as $sql) {
        $db->exec($sql);
    }
    foreach ([
        'CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (email)',
        'CREATE UNIQUE INDEX IF NOT EXISTS users_phone_uq ON users (phone)',
        'CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users (username)',
        'CREATE INDEX IF NOT EXISTS messages_chat_idx ON messages (chat_id, id)',
        'CREATE INDEX IF NOT EXISTS members_user_idx ON chat_members (user_id)',
    ] as $sql) {
        try {
            $db->exec($sql);
        } catch (Throwable $e) {
            try {
                $db->exec(str_replace(' IF NOT EXISTS', '', $sql));
            } catch (Throwable $e2) {
            }
        }
    }
    if (!$db->one('SELECT skey FROM settings WHERE skey = ?', ['max_upload'])) {
        $db->exec('INSERT INTO settings (skey, svalue) VALUES (?, ?)', ['max_upload', '8388608']);
        $db->exec('INSERT INTO settings (skey, svalue) VALUES (?, ?)', ['allow_signups', '1']);
    }
    if (!$db->one('SELECT skey FROM settings WHERE skey = ?', ['vapid_public'])) {
        $keys = vapid_create();
        $db->exec('INSERT INTO settings (skey, svalue) VALUES (?, ?)', ['vapid_public', $keys['public']]);
        $db->exec('INSERT INTO settings (skey, svalue) VALUES (?, ?)', ['vapid_private', $keys['private']]);
    }
}

function setting(string $key, string $fallback = ''): string
{
    $row = db()->one('SELECT svalue FROM settings WHERE skey = ?', [$key]);
    return $row['svalue'] ?? $fallback;
}

function app_key(): string
{
    $hex = (string) cfg()['key'];
    $bin = hex2bin($hex);
    if ($bin === false || strlen($bin) < 32) {
        fail('config', 500);
    }
    return substr($bin, 0, 32);
}

function enc(string $plain): string
{
    $iv = random_bytes(12);
    $tag = '';
    $ct = openssl_encrypt($plain, 'aes-256-gcm', app_key(), OPENSSL_RAW_DATA, $iv, $tag);
    if ($ct === false) {
        fail('crypto', 500);
    }
    return base64_encode($iv . $tag . $ct);
}

function dec(?string $stored): ?string
{
    if ($stored === null || $stored === '') {
        return null;
    }
    $raw = base64_decode($stored, true);
    if ($raw === false || strlen($raw) < 29) {
        return null;
    }
    $iv = substr($raw, 0, 12);
    $tag = substr($raw, 12, 16);
    $ct = substr($raw, 28);
    $plain = openssl_decrypt($ct, 'aes-256-gcm', app_key(), OPENSSL_RAW_DATA, $iv, $tag);
    return $plain === false ? null : $plain;
}

function b64url(string $bin): string
{
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function b64url_dec(string $text): string
{
    $pad = strlen($text) % 4;
    if ($pad) {
        $text .= str_repeat('=', 4 - $pad);
    }
    return base64_decode(strtr($text, '-_', '+/'), true) ?: '';
}

function jwt_issue(int $userId, int $version): string
{
    $header = b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = b64url(json_encode([
        'sub' => $userId,
        'tv' => $version,
        'exp' => time() + 60 * 60 * 24 * 14,
    ]));
    $sig = b64url(hash_hmac('sha256', $header . '.' . $payload, app_key(), true));
    return $header . '.' . $payload . '.' . $sig;
}

function jwt_user(): ?array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($header, 'Bearer ')) {
        return null;
    }
    $parts = explode('.', substr($header, 7));
    if (count($parts) !== 3) {
        return null;
    }
    $expect = b64url(hash_hmac('sha256', $parts[0] . '.' . $parts[1], app_key(), true));
    if (!hash_equals($expect, $parts[2])) {
        return null;
    }
    $data = json_decode(b64url_dec($parts[1]), true);
    if (!is_array($data) || (int) ($data['exp'] ?? 0) < time()) {
        return null;
    }
    $user = db()->one('SELECT * FROM users WHERE id = ?', [(int) $data['sub']]);
    if (!$user || (int) $user['token_version'] !== (int) ($data['tv'] ?? -1) || (int) $user['suspended'] === 1) {
        return null;
    }
    return $user;
}

function require_user(): array
{
    $user = jwt_user();
    if (!$user) {
        fail('unauthorized', 401);
    }
    return $user;
}

function hash_password(string $password): string
{
    if (defined('PASSWORD_ARGON2ID')) {
        return password_hash($password, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1]);
    }
    return password_hash($password, PASSWORD_BCRYPT);
}

function rate_limit(string $bucket, int $limit, int $windowSec): void
{
    $key = $bucket . '|' . client_ip();
    $now = time();
    $row = db()->one('SELECT window_start, hits FROM rate_limits WHERE rk = ?', [$key]);
    if (!$row || ($now - (int) $row['window_start']) >= $windowSec) {
        if ($row) {
            db()->exec('UPDATE rate_limits SET window_start = ?, hits = 1 WHERE rk = ?', [$now, $key]);
        } else {
            db()->exec('INSERT INTO rate_limits (rk, window_start, hits) VALUES (?, ?, 1)', [$key, $now]);
        }
        return;
    }
    if ((int) $row['hits'] >= $limit) {
        fail('rate', 429);
    }
    db()->exec('UPDATE rate_limits SET hits = hits + 1 WHERE rk = ?', [$key]);
}

function username_ok(string $name): bool
{
    return (bool) preg_match('/^[a-z0-9._]{3,24}$/', $name);
}

function normalize_phone(string $raw): string
{
    $raw = trim($raw);
    if ($raw === '') {
        return '';
    }
    $plus = str_starts_with($raw, '+');
    $digits = preg_replace('/\D+/', '', $raw) ?? '';
    if ($digits === '') {
        return '';
    }
    if (str_starts_with($digits, '00')) {
        $digits = substr($digits, 2);
        $plus = true;
    }
    if (!$plus && str_starts_with($digits, '0')) {
        $digits = '98' . substr($digits, 1);
    } elseif (!$plus && preg_match('/^9\d{9}$/', $digits)) {
        $digits = '98' . $digits;
    }
    return '+' . $digits;
}

function phone_ok(string $phone): bool
{
    return (bool) preg_match('/^\+[1-9][0-9]{7,14}$/', normalize_phone($phone));
}

function email_ok(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function is_contact(int $owner, int $contact): bool
{
    return (bool) db()->one('SELECT 1 AS n FROM contacts WHERE owner_id = ? AND contact_id = ?', [$owner, $contact]);
}

function blocked_either(int $a, int $b): bool
{
    return (bool) db()->one(
        'SELECT 1 AS n FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)',
        [$a, $b, $b, $a]
    );
}

function privacy_allows(array $owner, array $viewer, string $level): bool
{
    if ((int) $owner['id'] === (int) $viewer['id']) {
        return true;
    }
    if (blocked_either((int) $owner['id'], (int) $viewer['id'])) {
        return false;
    }
    if ($level === 'nobody') {
        return false;
    }
    if ($level === 'contacts') {
        return is_contact((int) $owner['id'], (int) $viewer['id']);
    }
    return true;
}

function can_see(array $owner, array $viewer, string $field): bool
{
    if ((int) $owner['id'] === (int) $viewer['id']) {
        return true;
    }
    $level = match ($field) {
        'online' => ((int) $owner['hide_online'] === 1) ? 'nobody' : 'everyone',
        'typing' => ((int) $owner['share_typing'] === 1) ? 'everyone' : 'nobody',
        'last_seen' => (string) $owner['privacy_last_seen'],
        'photo' => (string) $owner['privacy_photo'],
        'about' => (string) $owner['privacy_about'],
        'status' => (string) $owner['privacy_status'],
        default => 'nobody',
    };
    if (!privacy_allows($owner, $viewer, $level)) {
        return false;
    }
    if (in_array($field, ['last_seen', 'online', 'typing', 'photo'], true)) {
        $back = match ($field) {
            'online' => ((int) $viewer['hide_online'] === 1) ? 'nobody' : 'everyone',
            'typing' => ((int) $viewer['share_typing'] === 1) ? 'everyone' : 'nobody',
            'last_seen' => (string) $viewer['privacy_last_seen'],
            'photo' => (string) $viewer['privacy_photo'],
            default => 'everyone',
        };
        if (!privacy_allows($viewer, $owner, $back)) {
            return false;
        }
    }
    return true;
}

function public_user(array $row, array $viewer): array
{
    $seePhoto = can_see($row, $viewer, 'photo');
    $seeAbout = can_see($row, $viewer, 'about');
    $seePresence = can_see($row, $viewer, 'last_seen');
    $seeOnline = can_see($row, $viewer, 'online');
    $online = $seeOnline && !empty($row['last_seen_at']) && (time() - strtotime($row['last_seen_at'] . ' UTC') < 35);
    return [
        'id' => (int) $row['id'],
        'username' => $row['username'],
        'displayName' => $row['display_name'],
        'about' => $seeAbout ? $row['about'] : null,
        'phone' => is_contact((int) $viewer['id'], (int) $row['id']) || (int) $viewer['id'] === (int) $row['id'] ? $row['phone'] : null,
        'hasAvatar' => $seePhoto && !empty($row['avatar_file']),
        'avatarFile' => ($seePhoto && !empty($row['avatar_file'])) ? $row['avatar_file'] : null,
        'online' => (bool) $online,
        'lastSeenAt' => $seePresence ? $row['last_seen_at'] : null,
        'presenceHidden' => !$seePresence,
        'isContact' => is_contact((int) $viewer['id'], (int) $row['id']),
        'blockedByMe' => (bool) db()->one('SELECT 1 AS n FROM blocks WHERE blocker_id = ? AND blocked_id = ?', [(int) $viewer['id'], (int) $row['id']]),
    ];
}

function me_payload(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'username' => $user['username'],
        'displayName' => $user['display_name'],
        'about' => $user['about'],
        'hasAvatar' => !empty($user['avatar_file']),
        'avatarFile' => $user['avatar_file'] ?: null,
        'role' => $user['role'],
        'locale' => $user['locale'],
        'theme' => $user['theme'],
        'privacyLastSeen' => $user['privacy_last_seen'],
        'privacyPhoto' => $user['privacy_photo'],
        'privacyAbout' => $user['privacy_about'],
        'privacyStatus' => $user['privacy_status'],
        'hideOnline' => (int) $user['hide_online'] === 1,
        'shareTyping' => (int) $user['share_typing'] === 1,
        'readReceipts' => (int) $user['read_receipts'] === 1,
        'notifSound' => (int) $user['notif_sound'] === 1,
        'twoFactor' => (int) $user['two_factor'] === 1,
        'vapidPublic' => setting('vapid_public'),
    ];
}

function member(int $chatId, int $userId): ?array
{
    return db()->one('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?', [$chatId, $userId]);
}

function touch_seen(array $user): void
{
    db()->exec('UPDATE users SET last_seen_at = ? WHERE id = ?', [now(), (int) $user['id']]);
}

function send_mail(string $to, string $subject, string $text): void
{
    $dir = app_root() . '/storage';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    file_put_contents($dir . '/mail.log', now() . " $to | $subject | $text\n", FILE_APPEND);
    @mail($to, $subject, $text, 'Content-Type: text/plain; charset=utf-8');
}

function send_sms(string $phone, string $text): void
{
    $dir = app_root() . '/storage';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    file_put_contents($dir . '/sms.log', now() . " $phone | $text\n", FILE_APPEND);
    $url = (string) (cfg()['sms_url'] ?? '');
    if ($url === '' || !str_starts_with($url, 'https://')) {
        return;
    }
    $url = str_replace(['{phone}', '{text}'], [rawurlencode($phone), rawurlencode($text)], $url);
    $ctx = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
    @file_get_contents($url, false, $ctx);
}

function deliver_code(array $user, string $subject, string $text): void
{
    if (!empty($user['email'])) {
        send_mail((string) $user['email'], $subject, $text);
    }
    if (!empty($user['phone'])) {
        send_sms((string) $user['phone'], $subject . "\n" . $text);
    }
}

function seal_bytes(string $plain): string
{
    $iv = random_bytes(12);
    $tag = '';
    $ct = openssl_encrypt($plain, 'aes-256-gcm', app_key(), OPENSSL_RAW_DATA, $iv, $tag);
    if ($ct === false) {
        return $plain;
    }
    return 'NINI1' . $iv . $tag . $ct;
}

function open_bytes(string $blob): string
{
    if (!str_starts_with($blob, 'NINI1') || strlen($blob) < 34) {
        return $blob;
    }
    $raw = substr($blob, 5);
    $iv = substr($raw, 0, 12);
    $tag = substr($raw, 12, 16);
    $ct = substr($raw, 28);
    $plain = openssl_decrypt($ct, 'aes-256-gcm', app_key(), OPENSSL_RAW_DATA, $iv, $tag);
    return $plain === false ? '' : $plain;
}

function vapid_create(): array
{
    $key = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
    if ($key === false) {
        return ['public' => '', 'private' => ''];
    }
    $details = openssl_pkey_get_details($key);
    openssl_pkey_export($key, $pem);
    $x = str_pad($details['ec']['x'], 32, "\0", STR_PAD_LEFT);
    $y = str_pad($details['ec']['y'], 32, "\0", STR_PAD_LEFT);
    return ['public' => b64url("\x04" . $x . $y), 'private' => base64_encode($pem)];
}

function write_backup(bool $force = false): string
{
    $dest = app_root() . '/storage/backups';
    if (!is_dir($dest)) {
        mkdir($dest, 0775, true);
    }
    $file = $dest . '/backup-' . ($force ? gmdate('Y-m-d-His') : gmdate('Y-m-d')) . '.sql';
    if (is_file($file) && !$force) {
        return $file;
    }
    $tables = ['users', 'contacts', 'blocks', 'reports', 'chats', 'chat_members', 'messages', 'message_hides', 'message_receipts', 'statuses', 'status_views', 'settings', 'notifications', 'push_subs'];
    $sql = '-- chat-nini backup ' . gmdate('c') . "\n";
    foreach ($tables as $table) {
        $rows = db()->all('SELECT * FROM ' . $table);
        foreach ($rows as $row) {
            $cols = array_keys($row);
            $vals = array_map(static function ($v) {
                if ($v === null) {
                    return 'NULL';
                }
                return "'" . str_replace("'", "''", (string) $v) . "'";
            }, array_values($row));
            $sql .= 'INSERT INTO ' . $table . ' (' . implode(',', $cols) . ') VALUES (' . implode(',', $vals) . ");\n";
        }
    }
    file_put_contents($file, $sql);
    return $file;
}

function storage_dir(string $name): string
{
    $dir = app_root() . '/storage/' . $name;
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    return $dir;
}

function max_upload(): int
{
    return max(200000, min(20000000, (int) setting('max_upload', '8388608')));
}

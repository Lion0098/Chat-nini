<?php
declare(strict_types=1);

require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/webpush.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = preg_replace('#^/api#', '', $uri) ?? '/';
$path = rtrim($path, '/') ?: '/';

try {
    dispatch($method, $path);
} catch (Throwable $e) {
    if (cfg()['debug']) {
        error_log($e->getMessage() . "\n" . $e->getTraceAsString());
    }
    fail('server', 500);
}

function dispatch(string $method, string $path): void
{
    if ($method === 'GET' && $path === '/health') {
        ok(['app' => APP_NAME, 'stack' => 'php']);
    }
    if ($method === 'POST' && $path === '/auth/register') {
        register();
    }
    if ($method === 'POST' && $path === '/auth/login') {
        login();
    }
    if ($method === 'POST' && $path === '/auth/verify-2fa') {
        verify_2fa();
    }
    if ($method === 'POST' && $path === '/auth/forgot') {
        forgot();
    }
    if ($method === 'POST' && $path === '/auth/reset') {
        reset_password();
    }
    $user = require_user();
    touch_seen($user);
    if ($method === 'POST' && $path === '/auth/logout-all') {
        db()->exec('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [(int) $user['id']]);
        ok(true);
    }
    if ($method === 'GET' && $path === '/me') {
        ok(me_payload(fresh($user)));
    }
    if ($method === 'POST' && $path === '/me') {
        save_me($user);
    }
    if ($method === 'POST' && $path === '/me/avatar') {
        set_avatar($user);
    }
    if ($method === 'POST' && $path === '/me/avatar/delete') {
        clear_avatar($user);
    }
    if ($method === 'POST' && $path === '/me/password') {
        change_password($user);
    }
    if ($method === 'POST' && $path === '/me/2fa') {
        $on = !empty(body()['enabled']);
        if ($on && empty($user['email']) && empty($user['phone'])) {
            fail('contact_required');
        }
        db()->exec('UPDATE users SET two_factor = ? WHERE id = ?', [$on ? 1 : 0, (int) $user['id']]);
        ok(true);
    }
    if ($method === 'GET' && $path === '/users/search') {
        search_users($user);
    }
    if ($method === 'GET' && $path === '/contacts') {
        list_contacts($user);
    }
    if ($method === 'POST' && $path === '/contacts') {
        set_contact($user);
    }
    if ($method === 'GET' && $path === '/blocks') {
        $rows = db()->all('SELECT blocked_id FROM blocks WHERE blocker_id = ?', [(int) $user['id']]);
        $out = [];
        foreach ($rows as $row) {
            $u = db()->one('SELECT * FROM users WHERE id = ?', [(int) $row['blocked_id']]);
            if ($u) {
                $out[] = public_user($u, $user);
            }
        }
        ok($out);
    }
    if ($method === 'POST' && $path === '/blocks') {
        set_block($user);
    }
    if ($method === 'POST' && $path === '/reports') {
        report_user($user);
    }
    if ($method === 'GET' && $path === '/chats') {
        ok(chat_list($user, !empty($_GET['archived'])));
    }
    if ($method === 'POST' && $path === '/chats/direct') {
        open_direct($user);
    }
    if ($method === 'POST' && $path === '/chats/group') {
        create_group($user);
    }
    if ($method === 'POST' && $path === '/chats/flags') {
        chat_flags($user);
    }
    if ($method === 'POST' && $path === '/chats/group/update') {
        update_group($user);
    }
    if ($method === 'POST' && $path === '/chats/members') {
        group_members($user);
    }
    if ($method === 'POST' && $path === '/chats/leave') {
        leave_group($user);
    }
    if ($method === 'GET' && $path === '/messages') {
        list_messages($user);
    }
    if ($method === 'POST' && $path === '/messages') {
        send_message($user);
    }
    if ($method === 'POST' && $path === '/messages/edit') {
        edit_message($user);
    }
    if ($method === 'POST' && $path === '/messages/delete') {
        delete_message($user);
    }
    if ($method === 'POST' && $path === '/messages/forward') {
        forward_message($user);
    }
    if ($method === 'POST' && $path === '/messages/pin') {
        pin_message($user);
    }
    if ($method === 'POST' && $path === '/messages/read') {
        mark_read($user);
    }
    if ($method === 'POST' && $path === '/typing') {
        set_typing($user);
    }
    if ($method === 'POST' && $path === '/upload/init') {
        upload_init($user);
    }
    if ($method === 'POST' && $path === '/upload/chunk') {
        upload_chunk($user);
    }
    if ($method === 'POST' && $path === '/upload/finish') {
        upload_finish($user);
    }
    if ($method === 'GET' && preg_match('#^/files/([a-f0-9]{16,64})$#', $path, $m)) {
        serve_file($user, $m[1]);
    }
    if ($method === 'GET' && $path === '/link-preview') {
        link_preview();
    }
    if ($method === 'GET' && $path === '/statuses') {
        ok(list_statuses($user));
    }
    if ($method === 'POST' && $path === '/statuses') {
        post_status($user);
    }
    if ($method === 'POST' && $path === '/statuses/view') {
        view_status($user);
    }
    if ($method === 'POST' && $path === '/statuses/delete') {
        $id = (int) (body()['id'] ?? 0);
        db()->exec('DELETE FROM statuses WHERE id = ? AND user_id = ?', [$id, (int) $user['id']]);
        ok(true);
    }
    if ($method === 'GET' && $path === '/statuses/viewers') {
        status_viewers($user);
    }
    if ($method === 'POST' && $path === '/live') {
        update_live($user);
    }
    if ($method === 'GET' && $path === '/poll') {
        poll($user);
    }
    if ($method === 'POST' && $path === '/push/subscribe') {
        subscribe_push($user);
    }
    if ($method === 'GET' && $path === '/notifications') {
        $rows = db()->all('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30', [(int) $user['id']]);
        ok($rows);
    }
    if ($method === 'POST' && $path === '/notifications/seen') {
        db()->exec('UPDATE notifications SET seen = 1 WHERE user_id = ?', [(int) $user['id']]);
        ok(true);
    }
    if (str_starts_with($path, '/admin')) {
        admin_dispatch($method, $path, $user);
    }
    fail('not_found', 404);
}

function fresh(array $user): array
{
    return db()->one('SELECT * FROM users WHERE id = ?', [(int) $user['id']]) ?? $user;
}

function register(): void
{
    rate_limit('register', 8, 3600);
    if (setting('allow_signups', '1') !== '1') {
        fail('signups_closed');
    }
    $b = body();
    $email = strtolower(clean($b['email'] ?? '', 120));
    $phone = normalize_phone(clean($b['phone'] ?? '', 20));
    $username = strtolower(clean($b['username'] ?? '', 24));
    $name = clean($b['displayName'] ?? '', 50);
    $password = (string) ($b['password'] ?? '');
    if (!$name) {
        fail('name_required');
    }
    if (!username_ok($username)) {
        fail('username_invalid');
    }
    if ($email === '' && $phone === '') {
        fail('login_required');
    }
    if ($email !== '' && !email_ok($email)) {
        fail('invalid_email');
    }
    if ($phone !== '' && !phone_ok($phone)) {
        fail('phone_invalid');
    }
    if (strlen($password) < 8) {
        fail('weak_password');
    }
    if (db()->one('SELECT id FROM users WHERE username = ?', [$username])) {
        fail('username_taken');
    }
    if ($email !== '' && db()->one('SELECT id FROM users WHERE email = ?', [$email])) {
        fail('email_taken');
    }
    if ($phone !== '' && db()->one('SELECT id FROM users WHERE phone = ?', [$phone])) {
        fail('phone_taken');
    }
    $id = db()->insert(
        'INSERT INTO users (email, phone, username, password_hash, display_name, created_at, last_seen_at, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $email !== '' ? $email : null,
            $phone !== '' ? $phone : null,
            $username,
            hash_password($password),
            $name,
            now(),
            now(),
            db()->one('SELECT id FROM users') ? 'user' : 'admin',
        ]
    );
    $user = db()->one('SELECT * FROM users WHERE id = ?', [$id]);
    ok(['token' => jwt_issue($id, (int) $user['token_version']), 'me' => me_payload($user)]);
}

function login(): void
{
    rate_limit('login', 12, 600);
    $b = body();
    $login = trim((string) ($b['login'] ?? ''));
    $password = (string) ($b['password'] ?? '');
    $user = find_user_by_login($login);
    if (!$user || !password_verify($password, (string) $user['password_hash'])) {
        fail('auth_failed', 401);
    }
    if ((int) $user['suspended'] === 1) {
        fail('suspended', 403);
    }
    if (password_needs_rehash((string) $user['password_hash'], defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT)) {
        db()->exec('UPDATE users SET password_hash = ? WHERE id = ?', [hash_password($password), (int) $user['id']]);
        $user = db()->one('SELECT * FROM users WHERE id = ?', [(int) $user['id']]);
    }
    if ((int) $user['two_factor'] === 1) {
        $code = (string) random_int(100000, 999999);
        $challenge = db()->insert(
            'INSERT INTO login_challenges (user_id, code_hash, expires_at) VALUES (?, ?, ?)',
            [(int) $user['id'], password_hash($code, PASSWORD_DEFAULT), gmdate('Y-m-d H:i:s', time() + 600)]
        );
        if (!empty($user['email']) || !empty($user['phone'])) {
            deliver_code($user, 'کد ورود چت‌نینی', "کد ورود: $code");
        }
        $payload = ['need2fa' => true, 'challenge' => $challenge];
        if (cfg()['debug']) {
            $payload['devCode'] = $code;
        }
        ok($payload);
    }
    ok(['token' => jwt_issue((int) $user['id'], (int) $user['token_version']), 'me' => me_payload($user)]);
}

function verify_2fa(): void
{
    rate_limit('2fa', 12, 600);
    $b = body();
    $id = (int) ($b['challenge'] ?? 0);
    $code = clean($b['code'] ?? '', 8);
    $row = db()->one('SELECT * FROM login_challenges WHERE id = ?', [$id]);
    if (!$row || $row['expires_at'] < now() || !password_verify($code, (string) $row['code_hash'])) {
        fail('bad_code', 401);
    }
    db()->exec('DELETE FROM login_challenges WHERE id = ?', [$id]);
    $user = db()->one('SELECT * FROM users WHERE id = ?', [(int) $row['user_id']]);
    if (!$user || (int) $user['suspended'] === 1) {
        fail('auth_failed', 401);
    }
    ok(['token' => jwt_issue((int) $user['id'], (int) $user['token_version']), 'me' => me_payload($user)]);
}

function forgot(): void
{
    rate_limit('forgot', 6, 3600);
    $b = body();
    $login = trim((string) ($b['login'] ?? $b['email'] ?? $b['phone'] ?? ''));
    $user = find_user_by_login($login);
    $dev = null;
    if ($user) {
        $token = bin2hex(random_bytes(16));
        db()->insert(
            'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [(int) $user['id'], hash('sha256', $token), gmdate('Y-m-d H:i:s', time() + 3600)]
        );
        deliver_code($user, 'بازیابی رمز چت‌نینی', "کد بازیابی: $token");
        if (cfg()['debug']) {
            $dev = $token;
        }
    }
    ok(['sent' => true, 'devToken' => $dev]);
}

function reset_password(): void
{
    $b = body();
    $token = clean($b['token'] ?? '', 80);
    $password = (string) ($b['password'] ?? '');
    if (strlen($password) < 8) {
        fail('weak_password');
    }
    $row = db()->one('SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > ?', [hash('sha256', $token), now()]);
    if (!$row) {
        fail('bad_token');
    }
    db()->exec('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?', [hash_password($password), (int) $row['user_id']]);
    db()->exec('DELETE FROM password_resets WHERE user_id = ?', [(int) $row['user_id']]);
    ok(true);
}

function save_me(array $user): void
{
    $b = body();
    $name = array_key_exists('displayName', $b) ? clean($b['displayName'], 50) : $user['display_name'];
    if ($name === '') {
        fail('name_required');
    }
    $about = array_key_exists('about', $b) ? clean($b['about'], 140) : $user['about'];
    $username = $user['username'];
    if (array_key_exists('username', $b)) {
        $username = strtolower(clean($b['username'], 24));
        if (!username_ok($username)) {
            fail('username_invalid');
        }
        $taken = db()->one('SELECT id FROM users WHERE username = ? AND id <> ?', [$username, (int) $user['id']]);
        if ($taken) {
            fail('username_taken');
        }
    }
    $email = $user['email'];
    if (array_key_exists('email', $b)) {
        $email = strtolower(clean($b['email'], 120));
        if ($email !== '' && !email_ok($email)) {
            fail('invalid_email');
        }
        if ($email !== '' && db()->one('SELECT id FROM users WHERE email = ? AND id <> ?', [$email, (int) $user['id']])) {
            fail('email_taken');
        }
        $email = $email !== '' ? $email : null;
    }
    $phone = $user['phone'];
    if (array_key_exists('phone', $b)) {
        $rawPhone = clean($b['phone'], 20);
        $phone = $rawPhone === '' ? '' : normalize_phone($rawPhone);
        if ($phone !== '' && !phone_ok($phone)) {
            fail('phone_invalid');
        }
        if ($phone !== '' && db()->one('SELECT id FROM users WHERE phone = ? AND id <> ?', [$phone, (int) $user['id']])) {
            fail('phone_taken');
        }
        $phone = $phone !== '' ? $phone : null;
    }
    $priv = static function (string $key, string $current) use ($b): string {
        if (!array_key_exists($key, $b)) {
            return $current;
        }
        $v = clean($b[$key], 16);
        return in_array($v, ['everyone', 'contacts', 'nobody'], true) ? $v : $current;
    };
    db()->exec(
        'UPDATE users SET display_name=?, about=?, username=?, email=?, phone=?, locale=?, theme=?,
            privacy_last_seen=?, privacy_photo=?, privacy_about=?, privacy_status=?,
            hide_online=?, share_typing=?, read_receipts=?, notif_sound=? WHERE id=?',
        [
            $name,
            $about,
            $username,
            $email,
            $phone,
            ($b['locale'] ?? $user['locale']) === 'en' ? 'en' : 'fa',
            ($b['theme'] ?? $user['theme']) === 'dark' ? 'dark' : 'light',
            $priv('privacyLastSeen', $user['privacy_last_seen']),
            $priv('privacyPhoto', $user['privacy_photo']),
            $priv('privacyAbout', $user['privacy_about']),
            $priv('privacyStatus', $user['privacy_status']),
            array_key_exists('hideOnline', $b) ? (!empty($b['hideOnline']) ? 1 : 0) : (int) $user['hide_online'],
            array_key_exists('shareTyping', $b) ? (!empty($b['shareTyping']) ? 1 : 0) : (int) $user['share_typing'],
            array_key_exists('readReceipts', $b) ? (!empty($b['readReceipts']) ? 1 : 0) : (int) $user['read_receipts'],
            array_key_exists('notifSound', $b) ? (!empty($b['notifSound']) ? 1 : 0) : (int) $user['notif_sound'],
            (int) $user['id'],
        ]
    );
    ok(me_payload(fresh($user)));
}

function set_avatar(array $user): void
{
    $file = clean(body()['fileId'] ?? '', 64);
    $up = finished_upload($user, $file);
    if (!str_starts_with((string) $up['mime'], 'image/')) {
        fail('bad_type');
    }
    $old = $user['avatar_file'] ?: null;
    db()->exec('UPDATE users SET avatar_file = ? WHERE id = ?', [$file, (int) $user['id']]);
    if ($old && $old !== $file) {
        release_file($old);
    }
    ok(true);
}

function clear_avatar(array $user): void
{
    $old = $user['avatar_file'] ?: null;
    db()->exec('UPDATE users SET avatar_file = NULL WHERE id = ?', [(int) $user['id']]);
    if ($old) {
        release_file($old);
    }
    ok(true);
}

function change_password(array $user): void
{
    rate_limit('password', 8, 600);
    $b = body();
    $current = (string) ($b['current'] ?? '');
    $next = (string) ($b['next'] ?? '');
    if (!password_verify($current, (string) $user['password_hash'])) {
        fail('bad_password');
    }
    if (strlen($next) < 8) {
        fail('weak_password');
    }
    db()->exec('UPDATE users SET password_hash = ? WHERE id = ?', [hash_password($next), (int) $user['id']]);
    ok(true);
}

function find_user_by_login(string $raw): ?array
{
    $raw = trim($raw);
    if ($raw === '') {
        return null;
    }
    $lower = strtolower($raw);
    if (email_ok($lower)) {
        $user = db()->one('SELECT * FROM users WHERE email = ?', [$lower]);
        if ($user) {
            return $user;
        }
    }
    $user = db()->one('SELECT * FROM users WHERE username = ?', [$lower]);
    if ($user) {
        return $user;
    }
    $phone = normalize_phone($raw);
    if (!phone_ok($phone)) {
        return null;
    }
    return db()->one('SELECT * FROM users WHERE phone = ? OR phone = ?', [$phone, ltrim($phone, '+')]);
}

function release_file(string $id): void
{
    $used = db()->one('SELECT id FROM users WHERE avatar_file = ?', [$id])
        || db()->one('SELECT id FROM chats WHERE avatar_file = ?', [$id])
        || db()->one('SELECT id FROM messages WHERE file_id = ?', [$id])
        || db()->one('SELECT id FROM statuses WHERE file_id = ?', [$id]);
    if ($used) {
        return;
    }
    $path = storage_dir('uploads') . '/' . $id;
    if (is_file($path)) {
        unlink($path);
    }
    db()->exec('DELETE FROM uploads WHERE id = ?', [$id]);
}

function search_users(array $user): void
{
    $q = strtolower(clean($_GET['q'] ?? '', 40));
    if (mb_strlen($q) < 2) {
        ok([]);
    }
    $like = '%' . str_replace(['%', '_'], '', $q) . '%';
    $rows = db()->all(
        "SELECT * FROM users WHERE id <> ? AND suspended = 0 AND ("
        . "LOWER(COALESCE(username, '')) LIKE ? OR LOWER(display_name) LIKE ? OR COALESCE(phone, '') LIKE ?"
        . ") ORDER BY display_name LIMIT 20",
        [(int) $user['id'], $like, $like, $like]
    );
    $out = [];
    foreach ($rows as $row) {
        if (!blocked_either((int) $user['id'], (int) $row['id'])) {
            $out[] = public_user($row, $user);
        }
    }
    ok($out);
}

function list_contacts(array $user): void
{
    $rows = db()->all(
        'SELECT u.* FROM contacts c JOIN users u ON u.id = c.contact_id WHERE c.owner_id = ? ORDER BY u.display_name',
        [(int) $user['id']]
    );
    ok(array_map(fn ($row) => public_user($row, $user), $rows));
}

function set_contact(array $user): void
{
    $b = body();
    $id = (int) ($b['userId'] ?? 0);
    if ($id === (int) $user['id'] || !db()->one('SELECT id FROM users WHERE id = ?', [$id])) {
        fail('not_found');
    }
    if (!empty($b['add'])) {
        if (!db()->one('SELECT 1 AS n FROM contacts WHERE owner_id = ? AND contact_id = ?', [(int) $user['id'], $id])) {
            db()->exec('INSERT INTO contacts (owner_id, contact_id, created_at) VALUES (?, ?, ?)', [(int) $user['id'], $id, now()]);
        }
    } else {
        db()->exec('DELETE FROM contacts WHERE owner_id = ? AND contact_id = ?', [(int) $user['id'], $id]);
    }
    ok(true);
}

function set_block(array $user): void
{
    $b = body();
    $id = (int) ($b['userId'] ?? 0);
    if ($id === (int) $user['id']) {
        fail('self');
    }
    if (!empty($b['block'])) {
        if (!db()->one('SELECT 1 AS n FROM blocks WHERE blocker_id = ? AND blocked_id = ?', [(int) $user['id'], $id])) {
            db()->exec('INSERT INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)', [(int) $user['id'], $id, now()]);
        }
    } else {
        db()->exec('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?', [(int) $user['id'], $id]);
    }
    ok(true);
}

function report_user(array $user): void
{
    rate_limit('report', 10, 3600);
    $b = body();
    $reason = clean($b['reason'] ?? '', 40);
    if (!in_array($reason, ['spam', 'harassment', 'other'], true)) {
        fail('bad_input');
    }
    db()->insert(
        'INSERT INTO reports (reporter_id, target_user_id, target_message_id, reason, details, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [(int) $user['id'], (int) ($b['userId'] ?? 0) ?: null, (int) ($b['messageId'] ?? 0) ?: null, $reason, clean($b['details'] ?? '', 500), now()]
    );
    ok(true);
}

function chat_list(array $user, bool $archived): array
{
    $rows = db()->all(
        'SELECT c.*, m.pinned, m.muted, m.archived, m.unread_mark, m.last_read_at, m.hidden_at, m.cleared_at, m.role AS my_role
         FROM chat_members m JOIN chats c ON c.id = m.chat_id
         WHERE m.user_id = ? AND m.archived = ? AND (m.hidden_at IS NULL OR c.updated_at > m.hidden_at)
         ORDER BY m.pinned DESC, c.updated_at DESC LIMIT 200',
        [(int) $user['id'], $archived ? 1 : 0]
    );
    $out = [];
    foreach ($rows as $row) {
        $out[] = chat_item($user, $row);
    }
    return $out;
}

function chat_item(array $user, array $row): array
{
    $peer = null;
    $pub = null;
    if ($row['kind'] === 'direct') {
        $peer = db()->one(
            'SELECT u.* FROM chat_members m JOIN users u ON u.id = m.user_id WHERE m.chat_id = ? AND m.user_id <> ?',
            [(int) $row['id'], (int) $user['id']]
        );
        if ($peer) {
            $pub = public_user($peer, $user);
        }
    }
    $last = db()->one(
        'SELECT * FROM messages WHERE chat_id = ? AND deleted_at IS NULL AND id NOT IN (
            SELECT message_id FROM message_hides WHERE user_id = ?
         ) ORDER BY id DESC LIMIT 1',
        [(int) $row['id'], (int) $user['id']]
    );
    $unread = (int) (db()->one(
        'SELECT COUNT(*) AS n FROM messages WHERE chat_id = ? AND sender_id <> ? AND deleted_at IS NULL
         AND (? IS NULL OR created_at > ?) AND id NOT IN (SELECT message_id FROM message_hides WHERE user_id = ?)',
        [(int) $row['id'], (int) $user['id'], $row['last_read_at'], $row['last_read_at'] ?? '', (int) $user['id']]
    )['n'] ?? 0);
    if ((int) $row['unread_mark'] === 1 && $unread === 0) {
        $unread = 1;
    }
    $title = $row['kind'] === 'group' ? ($row['title'] ?: 'گروه') : ($peer['display_name'] ?? 'کاربر');
    $payload = $last ? json_decode(dec($last['payload']) ?? 'null', true) : null;
    $preview = null;
    if ($last) {
        $preview = [
            'kind' => $last['kind'],
            'body' => is_array($payload) ? ($payload['body'] ?? null) : null,
            'mine' => (int) $last['sender_id'] === (int) $user['id'],
            'createdAt' => $last['created_at'],
        ];
    }
    $online = false;
    $lastSeen = null;
    $hidden = true;
    if ($pub) {
        $online = $pub['online'];
        $lastSeen = $pub['lastSeenAt'];
        $hidden = $pub['presenceHidden'];
    }
    return [
        'id' => (int) $row['id'],
        'kind' => $row['kind'],
        'title' => $title,
        'about' => $row['kind'] === 'group' ? $row['about'] : ($pub['about'] ?? null),
        'peerId' => $peer ? (int) $peer['id'] : null,
        'hasAvatar' => $row['kind'] === 'group' ? !empty($row['avatar_file']) : (bool) ($pub['hasAvatar'] ?? false),
        'avatarFile' => $row['kind'] === 'group' ? ($row['avatar_file'] ?: null) : ($pub['avatarFile'] ?? null),
        'pinned' => (int) $row['pinned'] === 1,
        'muted' => (int) $row['muted'] === 1,
        'archived' => (int) $row['archived'] === 1,
        'myRole' => $row['my_role'],
        'unread' => $unread,
        'updatedAt' => $row['updated_at'],
        'last' => $preview,
        'online' => $online,
        'lastSeenAt' => $lastSeen,
        'presenceHidden' => $hidden,
        'pinnedMessageId' => $row['pinned_message_id'] ? (int) $row['pinned_message_id'] : null,
    ];
}

function open_direct(array $user): void
{
    $id = (int) (body()['userId'] ?? 0);
    if ($id === (int) $user['id']) {
        fail('self');
    }
    $other = db()->one('SELECT * FROM users WHERE id = ? AND suspended = 0', [$id]);
    if (!$other || blocked_either((int) $user['id'], $id)) {
        fail('blocked');
    }
    $existing = db()->one(
        'SELECT c.id FROM chats c
         JOIN chat_members a ON a.chat_id = c.id AND a.user_id = ?
         JOIN chat_members b ON b.chat_id = c.id AND b.user_id = ?
         WHERE c.kind = ? LIMIT 1',
        [(int) $user['id'], $id, 'direct']
    );
    if ($existing) {
        db()->exec('UPDATE chat_members SET hidden_at = NULL WHERE chat_id = ? AND user_id = ?', [(int) $existing['id'], (int) $user['id']]);
        ok(['id' => (int) $existing['id']]);
    }
    $chat = db()->insert(
        'INSERT INTO chats (kind, title, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['direct', '', (int) $user['id'], now(), now()]
    );
    $stamp = now();
    db()->exec('INSERT INTO chat_members (chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)', [$chat, (int) $user['id'], 'member', $stamp]);
    db()->exec('INSERT INTO chat_members (chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)', [$chat, $id, 'member', $stamp]);
    if (!is_contact((int) $user['id'], $id)) {
        db()->exec('INSERT INTO contacts (owner_id, contact_id, created_at) VALUES (?, ?, ?)', [(int) $user['id'], $id, $stamp]);
    }
    ok(['id' => $chat]);
}

function create_group(array $user): void
{
    $b = body();
    $title = clean($b['title'] ?? '', 60);
    if ($title === '') {
        fail('name_required');
    }
    $ids = array_values(array_unique(array_map('intval', is_array($b['memberIds'] ?? null) ? $b['memberIds'] : [])));
    $chat = db()->insert(
        'INSERT INTO chats (kind, title, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['group', $title, (int) $user['id'], now(), now()]
    );
    db()->exec('INSERT INTO chat_members (chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)', [$chat, (int) $user['id'], 'owner', now()]);
    foreach ($ids as $id) {
        if ($id === (int) $user['id'] || blocked_either((int) $user['id'], $id)) {
            continue;
        }
        if (db()->one('SELECT id FROM users WHERE id = ? AND suspended = 0', [$id])) {
            db()->exec('INSERT INTO chat_members (chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)', [$chat, $id, 'member', now()]);
        }
    }
    system_message($chat, (int) $user['id'], 'گروه ساخته شد');
    ok(['id' => $chat]);
}

function update_group(array $user): void
{
    $b = body();
    $chatId = (int) ($b['chatId'] ?? 0);
    $mem = require_manager($user, $chatId);
    if ($mem['role'] === 'member') {
        fail('forbidden', 403);
    }
    $title = clean($b['title'] ?? '', 60);
    if ($title === '') {
        fail('name_required');
    }
    $avatar = $b['fileId'] ?? null;
    if ($avatar) {
        finished_upload($user, clean($avatar, 64));
        db()->exec('UPDATE chats SET title = ?, about = ?, avatar_file = ?, updated_at = ? WHERE id = ?', [$title, clean($b['about'] ?? '', 200), clean($avatar, 64), now(), $chatId]);
    } else {
        db()->exec('UPDATE chats SET title = ?, about = ?, updated_at = ? WHERE id = ?', [$title, clean($b['about'] ?? '', 200), now(), $chatId]);
    }
    ok(true);
}

function require_manager(array $user, int $chatId): array
{
    $chat = db()->one('SELECT * FROM chats WHERE id = ?', [$chatId]);
    $mem = member($chatId, (int) $user['id']);
    if (!$chat || !$mem || $chat['kind'] !== 'group') {
        fail('not_found', 404);
    }
    return $mem;
}

function group_members(array $user): void
{
    $b = body();
    $chatId = (int) ($b['chatId'] ?? 0);
    $mem = require_manager($user, $chatId);
    $action = clean($b['action'] ?? '', 16);
    $target = (int) ($b['userId'] ?? 0);
    if ($action === 'add') {
        if (!in_array($mem['role'], ['owner', 'admin'], true)) {
            fail('forbidden', 403);
        }
        if (!db()->one('SELECT id FROM users WHERE id = ?', [$target]) || blocked_either((int) $user['id'], $target)) {
            fail('not_found');
        }
        if (!member($chatId, $target)) {
            db()->exec('INSERT INTO chat_members (chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)', [$chatId, $target, 'member', now()]);
            system_message($chatId, (int) $user['id'], 'عضو جدید اضافه شد');
        }
        ok(true);
    }
    if ($action === 'remove') {
        if (!in_array($mem['role'], ['owner', 'admin'], true) || $target === (int) $user['id']) {
            fail('forbidden', 403);
        }
        $tmem = member($chatId, $target);
        if (!$tmem || $tmem['role'] === 'owner') {
            fail('forbidden', 403);
        }
        db()->exec('DELETE FROM chat_members WHERE chat_id = ? AND user_id = ?', [$chatId, $target]);
        system_message($chatId, (int) $user['id'], 'یک عضو حذف شد');
        ok(true);
    }
    if ($action === 'admin') {
        if ($mem['role'] !== 'owner') {
            fail('forbidden', 403);
        }
        db()->exec('UPDATE chat_members SET role = ? WHERE chat_id = ? AND user_id = ? AND role <> ?', [!empty($b['on']) ? 'admin' : 'member', $chatId, $target, 'owner']);
        ok(true);
    }
    fail('bad_input');
}

function leave_group(array $user): void
{
    $chatId = (int) (body()['chatId'] ?? 0);
    $mem = member($chatId, (int) $user['id']);
    $chat = db()->one('SELECT * FROM chats WHERE id = ?', [$chatId]);
    if (!$mem || !$chat || $chat['kind'] !== 'group') {
        fail('not_found');
    }
    if ($mem['role'] === 'owner') {
        $next = db()->one(
            'SELECT user_id FROM chat_members WHERE chat_id = ? AND user_id <> ? ORDER BY CASE role WHEN \'admin\' THEN 0 ELSE 1 END, joined_at LIMIT 1',
            [$chatId, (int) $user['id']]
        );
        if ($next) {
            db()->exec('UPDATE chat_members SET role = ? WHERE chat_id = ? AND user_id = ?', ['owner', $chatId, (int) $next['user_id']]);
        }
    }
    db()->exec('DELETE FROM chat_members WHERE chat_id = ? AND user_id = ?', [$chatId, (int) $user['id']]);
    system_message($chatId, (int) $user['id'], $user['display_name'] . ' از گروه خارج شد');
    ok(true);
}

function chat_flags(array $user): void
{
    $b = body();
    $chatId = (int) ($b['chatId'] ?? 0);
    if (!member($chatId, (int) $user['id'])) {
        fail('not_found');
    }
    $sets = [];
    $params = [];
    foreach (['pinned' => 'pinned', 'muted' => 'muted', 'archived' => 'archived', 'unread' => 'unread_mark'] as $in => $col) {
        if (array_key_exists($in, $b)) {
            $sets[] = "$col = ?";
            $params[] = !empty($b[$in]) ? 1 : 0;
        }
    }
    if (!empty($b['clear'])) {
        $sets[] = 'cleared_at = ?';
        $params[] = now();
    }
    if (!empty($b['delete'])) {
        $sets[] = 'hidden_at = ?';
        $params[] = now();
        $sets[] = 'cleared_at = ?';
        $params[] = now();
    }
    if (!$sets) {
        fail('bad_input');
    }
    $params[] = $chatId;
    $params[] = (int) $user['id'];
    db()->exec('UPDATE chat_members SET ' . implode(', ', $sets) . ' WHERE chat_id = ? AND user_id = ?', $params);
    ok(true);
}

function list_messages(array $user): void
{
    $chatId = (int) ($_GET['chatId'] ?? 0);
    $mem = member($chatId, (int) $user['id']);
    if (!$mem) {
        fail('not_found', 404);
    }
    $before = (int) ($_GET['before'] ?? 0);
    $q = clean($_GET['q'] ?? '', 80);
    $sql = 'SELECT * FROM messages WHERE chat_id = ?';
    $params = [$chatId];
    if (!empty($mem['cleared_at'])) {
        $sql .= ' AND created_at > ?';
        $params[] = $mem['cleared_at'];
    }
    if ($before > 0) {
        $sql .= ' AND id < ?';
        $params[] = $before;
    }
    $sql .= ' ORDER BY id DESC LIMIT 80';
    $rows = array_reverse(db()->all($sql, $params));
    $out = [];
    foreach ($rows as $row) {
        if (db()->one('SELECT 1 AS n FROM message_hides WHERE message_id = ? AND user_id = ?', [(int) $row['id'], (int) $user['id']])) {
            continue;
        }
        $item = message_item($user, $row);
        if ($q !== '' && !str_contains(mb_strtolower((string) ($item['body'] ?? '') . (string) ($item['fileName'] ?? '')), mb_strtolower($q))) {
            continue;
        }
        if ((int) $row['sender_id'] !== (int) $user['id'] && !$row['deleted_at']) {
            $receipt = db()->one('SELECT * FROM message_receipts WHERE message_id = ? AND user_id = ?', [(int) $row['id'], (int) $user['id']]);
            if (!$receipt) {
                db()->exec('INSERT INTO message_receipts (message_id, user_id, delivered_at) VALUES (?, ?, ?)', [(int) $row['id'], (int) $user['id'], now()]);
            } elseif (!$receipt['delivered_at']) {
                db()->exec('UPDATE message_receipts SET delivered_at = ? WHERE message_id = ? AND user_id = ?', [now(), (int) $row['id'], (int) $user['id']]);
            }
        }
        $out[] = $item;
    }
    $members = chat_people($user, $chatId);
    $typing = typing_rows($user, $chatId);
    ok(['messages' => $out, 'members' => $members, 'typing' => $typing, 'pinnedMessageId' => (int) (db()->one('SELECT pinned_message_id FROM chats WHERE id = ?', [$chatId])['pinned_message_id'] ?? 0)]);
}

function message_item(array $user, array $row): array
{
    $payload = json_decode(dec($row['payload']) ?? 'null', true);
    $sender = db()->one('SELECT display_name, read_receipts FROM users WHERE id = ?', [(int) $row['sender_id']]);
    $receipts = db()->all('SELECT * FROM message_receipts WHERE message_id = ?', [(int) $row['id']]);
    $others = db()->all('SELECT user_id FROM chat_members WHERE chat_id = ? AND user_id <> ?', [(int) $row['chat_id'], (int) $row['sender_id']]);
    $delivered = $others && count(array_filter($receipts, fn ($r) => $r['delivered_at'])) >= count($others);
    $read = $others && count(array_filter($receipts, fn ($r) => $r['read_at'])) >= count($others);
    $senderReceipts = !$sender || (int) $sender['read_receipts'] === 1;
    $viewerReceipts = (int) $user['read_receipts'] === 1;
    $reply = null;
    if (!empty($row['reply_to'])) {
        $parent = db()->one('SELECT id, kind, payload, deleted_at FROM messages WHERE id = ?', [(int) $row['reply_to']]);
        if ($parent) {
            $pp = json_decode(dec($parent['payload']) ?? 'null', true);
            $snippet = $parent['deleted_at'] ? '' : (is_array($pp) ? (string) ($pp['body'] ?? '') : '');
            if ($snippet === '') {
                $snippet = (string) $parent['kind'];
            }
            $reply = ['id' => (int) $parent['id'], 'kind' => $parent['kind'], 'body' => mb_substr($snippet, 0, 80)];
        }
    }
    return [
        'id' => (int) $row['id'],
        'chatId' => (int) $row['chat_id'],
        'senderId' => (int) $row['sender_id'],
        'senderName' => $sender['display_name'] ?? '',
        'kind' => $row['kind'],
        'body' => $row['deleted_at'] ? null : (is_array($payload) ? ($payload['body'] ?? null) : null),
        'meta' => $row['deleted_at'] ? null : (is_array($payload) ? ($payload['meta'] ?? null) : null),
        'replyTo' => $row['reply_to'] ? (int) $row['reply_to'] : null,
        'forwarded' => (int) $row['forwarded'] === 1,
        'fileId' => $row['deleted_at'] ? null : $row['file_id'],
        'fileName' => $row['file_name'],
        'fileMime' => $row['file_mime'],
        'fileSize' => $row['file_size'] ? (int) $row['file_size'] : null,
        'createdAt' => $row['created_at'],
        'editedAt' => $row['edited_at'],
        'deleted' => (bool) $row['deleted_at'],
        'mine' => (int) $row['sender_id'] === (int) $user['id'],
        'delivered' => $delivered,
        'read' => $read && $senderReceipts && $viewerReceipts,
        'reply' => $reply,
    ];
}

function chat_people(array $user, int $chatId): array
{
    $rows = db()->all('SELECT u.*, m.role, m.last_read_at FROM chat_members m JOIN users u ON u.id = m.user_id WHERE m.chat_id = ?', [$chatId]);
    $out = [];
    foreach ($rows as $row) {
        $pub = public_user($row, $user);
        $pub['role'] = $row['role'];
        $pub['lastReadAt'] = $row['last_read_at'];
        $out[] = $pub;
    }
    return $out;
}

function typing_rows(array $viewer, int $chatId): array
{
    db()->exec('DELETE FROM typing WHERE until_at < ?', [now()]);
    $rows = db()->all('SELECT t.*, u.display_name FROM typing t JOIN users u ON u.id = t.user_id WHERE t.chat_id = ? AND t.user_id <> ?', [$chatId, (int) $viewer['id']]);
    $out = [];
    foreach ($rows as $row) {
        $owner = db()->one('SELECT * FROM users WHERE id = ?', [(int) $row['user_id']]);
        if ($owner && can_see($owner, $viewer, 'typing')) {
            $out[] = ['name' => $row['display_name'], 'kind' => $row['kind']];
        }
    }
    return $out;
}

function send_message(array $user): void
{
    rate_limit('send', 40, 60);
    $b = body();
    $chatId = (int) ($b['chatId'] ?? 0);
    $kind = clean($b['kind'] ?? '', 24);
    $allowed = ['text', 'image', 'video', 'audio', 'file', 'sticker', 'gif', 'contact', 'location', 'live_location', 'video_note'];
    if (!member($chatId, (int) $user['id']) || !in_array($kind, $allowed, true)) {
        fail('bad_input');
    }
    $chat = db()->one('SELECT * FROM chats WHERE id = ?', [$chatId]);
    if ($chat['kind'] === 'direct') {
        $other = db()->one('SELECT user_id FROM chat_members WHERE chat_id = ? AND user_id <> ?', [$chatId, (int) $user['id']]);
        if ($other && blocked_either((int) $user['id'], (int) $other['user_id'])) {
            fail('blocked');
        }
    }
    $bodyText = clean($b['body'] ?? '', 4000);
    $meta = is_array($b['meta'] ?? null) ? $b['meta'] : [];
    $fileId = null;
    $fileName = null;
    $fileMime = null;
    $fileSize = null;
    if (in_array($kind, ['image', 'video', 'audio', 'file', 'video_note'], true) || ($kind === 'gif' && !empty($b['fileId']))) {
        $fileId = clean($b['fileId'] ?? '', 64);
        $up = finished_upload($user, $fileId);
        $fileName = $up['name'];
        $fileMime = $up['mime'];
        $fileSize = (int) $up['size'];
        if ($kind === 'gif' && $fileMime !== 'image/gif' && $fileMime !== 'image/webp') {
            fail('bad_type');
        }
    }
    if ($kind === 'sticker') {
        $id = clean($meta['sticker'] ?? '', 32);
        if (!preg_match('/^s[0-9]{1,2}$/', $id)) {
            fail('bad_input');
        }
        $meta = ['sticker' => $id];
    }
    if ($kind === 'contact') {
        $cid = (int) ($meta['userId'] ?? 0);
        $c = db()->one('SELECT id, display_name, username, phone FROM users WHERE id = ?', [$cid]);
        if (!$c) {
            fail('not_found');
        }
        $meta = ['userId' => (int) $c['id'], 'name' => $c['display_name'], 'username' => $c['username'], 'phone' => $c['phone']];
    }
    if ($kind === 'location' || $kind === 'live_location') {
        $lat = (float) ($meta['lat'] ?? 999);
        $lng = (float) ($meta['lng'] ?? 999);
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            fail('bad_input');
        }
        $meta = ['lat' => $lat, 'lng' => $lng, 'label' => clean($meta['label'] ?? '', 80)];
    }
    if ($kind === 'gif' && !$fileId) {
        $url = clean($meta['url'] ?? '', 400);
        if (!preg_match('#^https://#', $url)) {
            fail('bad_input');
        }
        $meta = ['url' => $url];
    }
    if ($kind === 'text' && $bodyText === '') {
        fail('empty');
    }
    $reply = (int) ($b['replyTo'] ?? 0);
    if ($reply && !db()->one('SELECT id FROM messages WHERE id = ? AND chat_id = ?', [$reply, $chatId])) {
        $reply = 0;
    }
    $id = db()->insert(
        'INSERT INTO messages (chat_id, sender_id, kind, payload, reply_to, forwarded, file_id, file_name, file_mime, file_size, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$chatId, (int) $user['id'], $kind, enc(json_encode(['body' => $bodyText, 'meta' => $meta], JSON_UNESCAPED_UNICODE)), $reply ?: null, !empty($b['forwarded']) ? 1 : 0, $fileId, $fileName, $fileMime, $fileSize, now()]
    );
    if ($kind === 'live_location') {
        $mins = (int) ($b['minutes'] ?? 15);
        if (!in_array($mins, [15, 30, 60], true)) {
            $mins = 15;
        }
        db()->exec(
            'INSERT INTO live_locations (message_id, lat, lng, expires_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [$id, $meta['lat'], $meta['lng'], gmdate('Y-m-d H:i:s', time() + $mins * 60), now()]
        );
    }
    db()->exec('UPDATE chats SET updated_at = ? WHERE id = ?', [now(), $chatId]);
    db()->exec('UPDATE chat_members SET hidden_at = NULL WHERE chat_id = ?', [$chatId]);
    db()->exec('DELETE FROM typing WHERE chat_id = ? AND user_id = ?', [$chatId, (int) $user['id']]);
    notify_members($user, $chatId, $kind, $bodyText);
    ok(['id' => $id]);
}

function notify_members(array $sender, int $chatId, string $kind, string $text): void
{
    $chat = db()->one('SELECT * FROM chats WHERE id = ?', [$chatId]);
    $title = $chat['kind'] === 'group' ? ($chat['title'] ?: 'گروه') : $sender['display_name'];
    $preview = $text !== '' ? $text : $kind;
    $members = db()->all('SELECT user_id, muted FROM chat_members WHERE chat_id = ? AND user_id <> ?', [$chatId, (int) $sender['id']]);
    foreach ($members as $mem) {
        if ((int) $mem['muted'] === 1) {
            continue;
        }
        db()->insert(
            'INSERT INTO notifications (user_id, chat_id, title, body, created_at) VALUES (?, ?, ?, ?, ?)',
            [(int) $mem['user_id'], $chatId, $title, mb_substr($preview, 0, 140), now()]
        );
        $subs = db()->all('SELECT * FROM push_subs WHERE user_id = ?', [(int) $mem['user_id']]);
        $pushBody = json_encode(['title' => $title, 'body' => mb_substr($preview, 0, 140)], JSON_UNESCAPED_UNICODE);
        foreach ($subs as $sub) {
            $code = webpush_send((string) $sub['endpoint'], (string) $sub['p256dh'], (string) $sub['auth'], $pushBody ?: '{}');
            if ($code === 404 || $code === 410) {
                db()->exec('DELETE FROM push_subs WHERE id = ?', [(int) $sub['id']]);
            }
        }
    }
}

function system_message(int $chatId, int $sender, string $text): void
{
    db()->insert(
        'INSERT INTO messages (chat_id, sender_id, kind, payload, created_at) VALUES (?, ?, ?, ?, ?)',
        [$chatId, $sender, 'system', enc(json_encode(['body' => $text, 'meta' => null])), now()]
    );
    db()->exec('UPDATE chats SET updated_at = ? WHERE id = ?', [now(), $chatId]);
}

function edit_message(array $user): void
{
    $b = body();
    $id = (int) ($b['id'] ?? 0);
    $text = clean($b['body'] ?? '', 4000);
    $row = db()->one('SELECT * FROM messages WHERE id = ?', [$id]);
    if (!$row || (int) $row['sender_id'] !== (int) $user['id'] || $row['kind'] !== 'text' || $row['deleted_at'] || $text === '') {
        fail('forbidden', 403);
    }
    $payload = json_decode(dec($row['payload']) ?? '{}', true) ?: [];
    $payload['body'] = $text;
    db()->exec('UPDATE messages SET payload = ?, edited_at = ? WHERE id = ?', [enc(json_encode($payload, JSON_UNESCAPED_UNICODE)), now(), $id]);
    ok(true);
}

function delete_message(array $user): void
{
    $b = body();
    $id = (int) ($b['id'] ?? 0);
    $scope = ($b['scope'] ?? '') === 'all' ? 'all' : 'me';
    $row = db()->one('SELECT * FROM messages WHERE id = ?', [$id]);
    if (!$row || !member((int) $row['chat_id'], (int) $user['id'])) {
        fail('not_found');
    }
    if ($scope === 'me') {
        if (!db()->one('SELECT 1 AS n FROM message_hides WHERE message_id = ? AND user_id = ?', [$id, (int) $user['id']])) {
            db()->exec('INSERT INTO message_hides (message_id, user_id) VALUES (?, ?)', [$id, (int) $user['id']]);
        }
        ok(true);
    }
    if ((int) $row['sender_id'] !== (int) $user['id']) {
        fail('forbidden', 403);
    }
    db()->exec('UPDATE messages SET deleted_at = ?, payload = NULL, file_id = NULL, file_name = NULL WHERE id = ?', [now(), $id]);
    ok(true);
}

function forward_message(array $user): void
{
    $b = body();
    $id = (int) ($b['id'] ?? 0);
    $to = (int) ($b['chatId'] ?? 0);
    $row = db()->one('SELECT * FROM messages WHERE id = ? AND deleted_at IS NULL', [$id]);
    if (!$row || !member((int) $row['chat_id'], (int) $user['id']) || !member($to, (int) $user['id'])) {
        fail('not_found');
    }
    if (db()->one('SELECT 1 AS n FROM message_hides WHERE message_id = ? AND user_id = ?', [$id, (int) $user['id']])) {
        fail('not_found');
    }
    $new = db()->insert(
        'INSERT INTO messages (chat_id, sender_id, kind, payload, forwarded, file_id, file_name, file_mime, file_size, created_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)',
        [$to, (int) $user['id'], $row['kind'], $row['payload'], $row['file_id'], $row['file_name'], $row['file_mime'], $row['file_size'], now()]
    );
    db()->exec('UPDATE chats SET updated_at = ? WHERE id = ?', [now(), $to]);
    db()->exec('UPDATE chat_members SET hidden_at = NULL WHERE chat_id = ?', [$to]);
    ok(['id' => $new]);
}

function pin_message(array $user): void
{
    $b = body();
    $id = (int) ($b['id'] ?? 0);
    $row = db()->one('SELECT * FROM messages WHERE id = ? AND deleted_at IS NULL', [$id]);
    if (!$row || !member((int) $row['chat_id'], (int) $user['id'])) {
        fail('not_found');
    }
    $chat = db()->one('SELECT * FROM chats WHERE id = ?', [(int) $row['chat_id']]);
    if ($chat['kind'] === 'group') {
        $mem = member((int) $chat['id'], (int) $user['id']);
        if (!in_array($mem['role'], ['owner', 'admin'], true)) {
            fail('forbidden', 403);
        }
    }
    $next = ((int) ($chat['pinned_message_id'] ?? 0) === $id) ? null : $id;
    db()->exec('UPDATE chats SET pinned_message_id = ? WHERE id = ?', [$next, (int) $chat['id']]);
    ok(['pinnedMessageId' => $next]);
}

function mark_read(array $user): void
{
    $chatId = (int) (body()['chatId'] ?? 0);
    if (!member($chatId, (int) $user['id'])) {
        fail('not_found');
    }
    db()->exec('UPDATE chat_members SET last_read_at = ?, unread_mark = 0 WHERE chat_id = ? AND user_id = ?', [now(), $chatId, (int) $user['id']]);
    if ((int) $user['read_receipts'] === 1) {
        $rows = db()->all('SELECT id FROM messages WHERE chat_id = ? AND sender_id <> ? AND deleted_at IS NULL', [$chatId, (int) $user['id']]);
        foreach ($rows as $row) {
            $have = db()->one('SELECT * FROM message_receipts WHERE message_id = ? AND user_id = ?', [(int) $row['id'], (int) $user['id']]);
            if (!$have) {
                db()->exec('INSERT INTO message_receipts (message_id, user_id, delivered_at, read_at) VALUES (?, ?, ?, ?)', [(int) $row['id'], (int) $user['id'], now(), now()]);
            } else {
                db()->exec('UPDATE message_receipts SET delivered_at = COALESCE(delivered_at, ?), read_at = COALESCE(read_at, ?) WHERE message_id = ? AND user_id = ?', [now(), now(), (int) $row['id'], (int) $user['id']]);
            }
        }
    }
    ok(true);
}

function set_typing(array $user): void
{
    $b = body();
    $chatId = (int) ($b['chatId'] ?? 0);
    if (!member($chatId, (int) $user['id'])) {
        fail('not_found');
    }
    if ((int) $user['share_typing'] !== 1 || ($b['kind'] ?? 'off') === 'off') {
        db()->exec('DELETE FROM typing WHERE chat_id = ? AND user_id = ?', [$chatId, (int) $user['id']]);
        ok(true);
    }
    $kind = ($b['kind'] ?? '') === 'recording' ? 'recording' : 'typing';
    $until = gmdate('Y-m-d H:i:s', time() + 6);
    $have = db()->one('SELECT 1 AS n FROM typing WHERE chat_id = ? AND user_id = ?', [$chatId, (int) $user['id']]);
    if ($have) {
        db()->exec('UPDATE typing SET kind = ?, until_at = ? WHERE chat_id = ? AND user_id = ?', [$kind, $until, $chatId, (int) $user['id']]);
    } else {
        db()->exec('INSERT INTO typing (chat_id, user_id, kind, until_at) VALUES (?, ?, ?, ?)', [$chatId, (int) $user['id'], $kind, $until]);
    }
    ok(true);
}

function upload_init(array $user): void
{
    rate_limit('upload', 30, 600);
    $b = body();
    $name = clean($b['name'] ?? 'file', 120);
    $name = str_replace(['/', '\\', "\0"], '', $name);
    $mime = strtolower(clean($b['mime'] ?? 'application/octet-stream', 80));
    $size = (int) ($b['size'] ?? 0);
    if ($size < 1 || $size > max_upload()) {
        fail('too_large');
    }
    if (preg_match('#^(text/html|image/svg|application/javascript|text/javascript)#', $mime)) {
        $mime = 'application/octet-stream';
    }
    $id = bin2hex(random_bytes(16));
    db()->exec(
        'INSERT INTO uploads (id, user_id, name, mime, size, received, done, created_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)',
        [$id, (int) $user['id'], $name !== '' ? $name : 'file', $mime, $size, now()]
    );
    ok(['id' => $id, 'chunk' => 480 * 1024]);
}

function upload_chunk(array $user): void
{
    $id = clean($_GET['id'] ?? '', 64);
    $offset = (int) ($_GET['offset'] ?? -1);
    $up = db()->one('SELECT * FROM uploads WHERE id = ? AND user_id = ? AND done = 0', [$id, (int) $user['id']]);
    if (!$up || $offset !== (int) $up['received']) {
        fail('bad_chunk');
    }
    $raw = file_get_contents('php://input') ?: '';
    $len = strlen($raw);
    if ($len < 1 || $len > 700000 || (int) $up['received'] + $len > (int) $up['size']) {
        fail('bad_chunk');
    }
    $path = storage_dir('chunks') . '/' . $id . '.part';
    file_put_contents($path, $raw, FILE_APPEND);
    db()->exec('UPDATE uploads SET received = received + ? WHERE id = ?', [$len, $id]);
    ok(['received' => (int) $up['received'] + $len]);
}

function upload_finish(array $user): void
{
    $id = clean(body()['id'] ?? '', 64);
    $up = db()->one('SELECT * FROM uploads WHERE id = ? AND user_id = ?', [$id, (int) $user['id']]);
    if (!$up || (int) $up['received'] !== (int) $up['size']) {
        fail('incomplete');
    }
    $src = storage_dir('chunks') . '/' . $id . '.part';
    $dst = storage_dir('uploads') . '/' . $id;
    if (!is_file($src)) {
        fail('incomplete');
    }
    rename($src, $dst);
    maybe_shrink_image($dst, (string) $up['mime']);
    $plain = file_get_contents($dst);
    if ($plain === false) {
        fail('incomplete');
    }
    file_put_contents($dst, seal_bytes($plain));
    $size = strlen($plain);
    db()->exec('UPDATE uploads SET done = 1, size = ? WHERE id = ?', [$size, $id]);
    ok(['id' => $id, 'name' => $up['name'], 'mime' => $up['mime'], 'size' => $size]);
}

function finished_upload(array $user, string $id): array
{
    $up = db()->one('SELECT * FROM uploads WHERE id = ? AND user_id = ? AND done = 1', [$id, (int) $user['id']]);
    if (!$up) {
        fail('bad_file');
    }
    return $up;
}

function maybe_shrink_image(string $path, string $mime): void
{
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true) || !function_exists('imagecreatefromstring')) {
        return;
    }
    $bin = file_get_contents($path);
    if ($bin === false) {
        return;
    }
    $img = @imagecreatefromstring($bin);
    if (!$img) {
        return;
    }
    $w = imagesx($img);
    $h = imagesy($img);
    $max = 1600;
    if ($w <= $max && $h <= $max) {
        imagedestroy($img);
        return;
    }
    $scale = $max / max($w, $h);
    $nw = max(1, (int) ($w * $scale));
    $nh = max(1, (int) ($h * $scale));
    $dst = imagecreatetruecolor($nw, $nh);
    imagecopyresampled($dst, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
    if ($mime === 'image/png') {
        imagepng($dst, $path, 6);
    } elseif ($mime === 'image/webp' && function_exists('imagewebp')) {
        imagewebp($dst, $path, 82);
    } else {
        imagejpeg($dst, $path, 82);
    }
    imagedestroy($img);
    imagedestroy($dst);
}

function serve_file(array $user, string $id): never
{
    $up = db()->one('SELECT * FROM uploads WHERE id = ? AND done = 1', [$id]);
    if (!$up) {
        fail('not_found', 404);
    }
    $allowed = (int) $up['user_id'] === (int) $user['id'];
    $msg = db()->one('SELECT chat_id FROM messages WHERE file_id = ?', [$id]);
    if ($msg && member((int) $msg['chat_id'], (int) $user['id'])) {
        $allowed = true;
    }
    $avatarOwner = db()->one('SELECT * FROM users WHERE avatar_file = ?', [$id]);
    if ($avatarOwner && can_see($avatarOwner, $user, 'photo')) {
        $allowed = true;
    }
    $group = db()->one('SELECT id FROM chats WHERE avatar_file = ?', [$id]);
    if ($group && member((int) $group['id'], (int) $user['id'])) {
        $allowed = true;
    }
    $status = db()->one('SELECT user_id FROM statuses WHERE file_id = ?', [$id]);
    if ($status) {
        $owner = db()->one('SELECT * FROM users WHERE id = ?', [(int) $status['user_id']]);
        if ($owner && can_see($owner, $user, 'status')) {
            $allowed = true;
        }
    }
    if (!$allowed) {
        fail('forbidden', 403);
    }
    $path = storage_dir('uploads') . '/' . $id;
    if (!is_file($path)) {
        fail('not_found', 404);
    }
    $blob = file_get_contents($path);
    if ($blob === false) {
        fail('not_found', 404);
    }
    $plain = open_bytes($blob);
    $mime = (string) $up['mime'];
    $inline = (bool) preg_match('#^(image/(jpeg|png|webp|gif)|video/(mp4|webm)|audio/)#', $mime);
    header('Content-Type: ' . ($inline ? $mime : 'application/octet-stream'));
    header('X-Content-Type-Options: nosniff');
    header('Content-Disposition: ' . ($inline ? 'inline' : 'attachment') . '; filename="' . rawurlencode((string) $up['name']) . '"');
    header('Content-Length: ' . (string) strlen($plain));
    header('Cache-Control: private, max-age=86400');
    echo $plain;
    exit;
}

function link_preview(): void
{
    rate_limit('preview', 20, 60);
    $url = clean($_GET['url'] ?? '', 400);
    if (!safe_public_url($url)) {
        fail('bad_url');
    }
    $ctx = stream_context_create(['http' => ['timeout' => 3, 'follow_location' => 0, 'header' => "User-Agent: ChatNini\r\n"]]);
    $html = @file_get_contents($url, false, $ctx, 0, 180000);
    if ($html === false) {
        ok(['url' => $url, 'title' => $url, 'description' => '', 'image' => null]);
    }
    $title = meta_content($html, 'og:title') ?: title_tag($html) ?: $url;
    $desc = meta_content($html, 'og:description') ?: '';
    $image = meta_content($html, 'og:image');
    ok(['url' => $url, 'title' => mb_substr($title, 0, 140), 'description' => mb_substr($desc, 0, 220), 'image' => $image && safe_public_url($image) ? $image : null]);
}

function meta_content(string $html, string $prop): ?string
{
    if (preg_match('#<meta[^>]+property=["\']' . preg_quote($prop, '#') . '["\'][^>]+content=["\']([^"\']+)#i', $html, $m)) {
        return html_entity_decode($m[1], ENT_QUOTES);
    }
    if (preg_match('#<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' . preg_quote($prop, '#') . '#i', $html, $m)) {
        return html_entity_decode($m[1], ENT_QUOTES);
    }
    return null;
}

function title_tag(string $html): ?string
{
    if (preg_match('#<title>([^<]+)</title>#i', $html, $m)) {
        return html_entity_decode(trim($m[1]), ENT_QUOTES);
    }
    return null;
}

function safe_public_url(string $url): bool
{
    $p = parse_url($url);
    if (!$p || !in_array(strtolower($p['scheme'] ?? ''), ['http', 'https'], true) || empty($p['host'])) {
        return false;
    }
    $ips = @gethostbynamel($p['host']) ?: [];
    if (!$ips) {
        return false;
    }
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return false;
        }
    }
    return true;
}

function list_statuses(array $user): array
{
    db()->exec('DELETE FROM statuses WHERE expires_at < ?', [now()]);
    $rows = db()->all('SELECT s.*, u.display_name, u.username, u.avatar_file FROM statuses s JOIN users u ON u.id = s.user_id WHERE s.expires_at > ? ORDER BY s.id DESC', [now()]);
    $out = [];
    foreach ($rows as $row) {
        $owner = db()->one('SELECT * FROM users WHERE id = ?', [(int) $row['user_id']]);
        if (!$owner || !can_see($owner, $user, 'status')) {
            continue;
        }
        $viewed = (bool) db()->one('SELECT 1 AS n FROM status_views WHERE status_id = ? AND viewer_id = ?', [(int) $row['id'], (int) $user['id']]);
        $out[] = [
            'id' => (int) $row['id'],
            'userId' => (int) $row['user_id'],
            'displayName' => $row['display_name'],
            'username' => $row['username'],
            'hasAvatar' => can_see($owner, $user, 'photo') && !empty($row['avatar_file']),
            'avatarFile' => (can_see($owner, $user, 'photo') && !empty($row['avatar_file'])) ? $row['avatar_file'] : null,
            'kind' => $row['kind'],
            'caption' => $row['caption'],
            'bg' => $row['bg'],
            'fileId' => $row['file_id'],
            'createdAt' => $row['created_at'],
            'viewed' => $viewed || (int) $row['user_id'] === (int) $user['id'],
            'mine' => (int) $row['user_id'] === (int) $user['id'],
        ];
    }
    return $out;
}

function post_status(array $user): void
{
    $b = body();
    $kind = clean($b['kind'] ?? '', 16);
    if (!in_array($kind, ['text', 'image', 'video'], true)) {
        fail('bad_input');
    }
    $file = null;
    if ($kind !== 'text') {
        $file = clean($b['fileId'] ?? '', 64);
        finished_upload($user, $file);
    }
    $caption = clean($b['caption'] ?? '', 300);
    if ($kind === 'text' && $caption === '') {
        fail('empty');
    }
    $id = db()->insert(
        'INSERT INTO statuses (user_id, kind, caption, bg, file_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [(int) $user['id'], $kind, $caption, clean($b['bg'] ?? '#008069', 16), $file, now(), gmdate('Y-m-d H:i:s', time() + 86400)]
    );
    ok(['id' => $id]);
}

function view_status(array $user): void
{
    $id = (int) (body()['id'] ?? 0);
    $row = db()->one('SELECT * FROM statuses WHERE id = ? AND expires_at > ?', [$id, now()]);
    if (!$row) {
        fail('not_found');
    }
    if ((int) $row['user_id'] !== (int) $user['id'] && !db()->one('SELECT 1 AS n FROM status_views WHERE status_id = ? AND viewer_id = ?', [$id, (int) $user['id']])) {
        db()->exec('INSERT INTO status_views (status_id, viewer_id, viewed_at) VALUES (?, ?, ?)', [$id, (int) $user['id'], now()]);
    }
    ok(true);
}

function status_viewers(array $user): void
{
    $id = (int) ($_GET['id'] ?? 0);
    $row = db()->one('SELECT * FROM statuses WHERE id = ? AND user_id = ?', [$id, (int) $user['id']]);
    if (!$row) {
        fail('not_found');
    }
    $rows = db()->all('SELECT u.display_name, u.username, v.viewed_at FROM status_views v JOIN users u ON u.id = v.viewer_id WHERE v.status_id = ?', [$id]);
    ok($rows);
}

function update_live(array $user): void
{
    $b = body();
    $id = (int) ($b['messageId'] ?? 0);
    $row = db()->one('SELECT * FROM messages WHERE id = ? AND sender_id = ? AND kind = ?', [$id, (int) $user['id'], 'live_location']);
    $live = db()->one('SELECT * FROM live_locations WHERE message_id = ?', [$id]);
    if (!$row || !$live || $live['expires_at'] < now()) {
        fail('not_found');
    }
    $lat = (float) ($b['lat'] ?? 999);
    $lng = (float) ($b['lng'] ?? 999);
    if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
        fail('bad_input');
    }
    db()->exec('UPDATE live_locations SET lat = ?, lng = ?, updated_at = ? WHERE message_id = ?', [$lat, $lng, now(), $id]);
    ok(true);
}

function mark_incoming_delivered(array $user): void
{
    $rows = db()->all(
        'SELECT msg.id FROM messages msg
         JOIN chat_members mem ON mem.chat_id = msg.chat_id AND mem.user_id = ?
         LEFT JOIN message_receipts r ON r.message_id = msg.id AND r.user_id = mem.user_id
         WHERE msg.sender_id <> ? AND msg.deleted_at IS NULL AND r.delivered_at IS NULL
         ORDER BY msg.id DESC LIMIT 150',
        [(int) $user['id'], (int) $user['id']]
    );
    foreach ($rows as $row) {
        $have = db()->one('SELECT message_id, delivered_at FROM message_receipts WHERE message_id = ? AND user_id = ?', [(int) $row['id'], (int) $user['id']]);
        if ($have) {
            if (!$have['delivered_at']) {
                db()->exec('UPDATE message_receipts SET delivered_at = ? WHERE message_id = ? AND user_id = ?', [now(), (int) $row['id'], (int) $user['id']]);
            }
        } else {
            db()->exec('INSERT INTO message_receipts (message_id, user_id, delivered_at) VALUES (?, ?, ?)', [(int) $row['id'], (int) $user['id'], now()]);
        }
    }
}

function poll(array $user): void
{
    mark_incoming_delivered($user);
    $notes = db()->all('SELECT * FROM notifications WHERE user_id = ? AND seen = 0 ORDER BY id DESC LIMIT 10', [(int) $user['id']]);
    $live = db()->all('SELECT * FROM live_locations WHERE expires_at > ?', [now()]);
    $archived = db()->one(
        'SELECT COUNT(*) AS n FROM chat_members m JOIN chats c ON c.id = m.chat_id
         WHERE m.user_id = ? AND m.archived = 1 AND (m.hidden_at IS NULL OR c.updated_at > m.hidden_at)',
        [(int) $user['id']]
    );
    ok([
        'chats' => chat_list($user, false),
        'archived' => (int) ($archived['n'] ?? 0),
        'notifications' => $notes,
        'statuses' => list_statuses($user),
        'live' => array_map(fn ($r) => ['messageId' => (int) $r['message_id'], 'lat' => (float) $r['lat'], 'lng' => (float) $r['lng'], 'expiresAt' => $r['expires_at']], $live),
        'now' => now(),
    ]);
}

function subscribe_push(array $user): void
{
    $b = body();
    $endpoint = clean($b['endpoint'] ?? '', 500);
    $p256 = clean($b['p256dh'] ?? '', 200);
    $auth = clean($b['auth'] ?? '', 80);
    if (!str_starts_with($endpoint, 'https://') || $p256 === '' || $auth === '') {
        fail('bad_input');
    }
    if (!db()->one('SELECT id FROM push_subs WHERE user_id = ? AND endpoint = ?', [(int) $user['id'], $endpoint])) {
        db()->insert(
            'INSERT INTO push_subs (user_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)',
            [(int) $user['id'], $endpoint, $p256, $auth, now()]
        );
    }
    ok(true);
}

function require_admin(array $user): void
{
    if (($user['role'] ?? '') !== 'admin') {
        fail('forbidden', 403);
    }
}

function admin_dispatch(string $method, string $path, array $user): void
{
    require_admin($user);
    if ($method === 'GET' && $path === '/admin/overview') {
        ok([
            'users' => (int) (db()->one('SELECT COUNT(*) AS n FROM users')['n'] ?? 0),
            'chats' => (int) (db()->one('SELECT COUNT(*) AS n FROM chats')['n'] ?? 0),
            'reports' => (int) (db()->one("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'")['n'] ?? 0),
            'allowSignups' => setting('allow_signups', '1') === '1',
            'maxUpload' => max_upload(),
        ]);
    }
    if ($method === 'GET' && $path === '/admin/users') {
        $q = strtolower(clean($_GET['q'] ?? '', 40));
        $like = '%' . str_replace(['%', '_'], '', $q) . '%';
        $sql = 'SELECT id, email, phone, username, display_name, role, suspended, created_at FROM users';
        $params = [];
        if ($q !== '') {
            $sql .= " WHERE LOWER(COALESCE(username,'')) LIKE ? OR LOWER(display_name) LIKE ? OR COALESCE(email,'') LIKE ? OR COALESCE(phone,'') LIKE ?";
            $params = [$like, $like, $like, $like];
        }
        $sql .= ' ORDER BY id DESC LIMIT 50';
        ok(db()->all($sql, $params));
    }
    if ($method === 'POST' && $path === '/admin/users') {
        $b = body();
        $email = strtolower(clean($b['email'] ?? '', 120));
        $phone = clean($b['phone'] ?? '', 16);
        $username = strtolower(clean($b['username'] ?? '', 24));
        $name = clean($b['displayName'] ?? '', 50);
        $password = (string) ($b['password'] ?? '');
        if ($name === '' || !username_ok($username) || strlen($password) < 8 || ($email === '' && $phone === '')) {
            fail('bad_input');
        }
        if ($email !== '' && !email_ok($email)) {
            fail('invalid_email');
        }
        if ($phone !== '' && !phone_ok($phone)) {
            fail('phone_invalid');
        }
        if (db()->one('SELECT id FROM users WHERE username = ?', [$username])) {
            fail('username_taken');
        }
        $id = db()->insert(
            'INSERT INTO users (email, phone, username, password_hash, display_name, created_at, last_seen_at, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [$email !== '' ? $email : null, $phone !== '' ? $phone : null, $username, hash_password($password), $name, now(), now(), 'user']
        );
        ok(['id' => $id]);
    }
    if ($method === 'POST' && $path === '/admin/user') {
        $b = body();
        $id = (int) ($b['id'] ?? 0);
        $row = db()->one('SELECT * FROM users WHERE id = ?', [$id]);
        if (!$row) {
            fail('not_found', 404);
        }
        $role = in_array(($b['role'] ?? $row['role']), ['user', 'admin'], true) ? (string) ($b['role'] ?? $row['role']) : (string) $row['role'];
        if ($id === (int) $user['id'] && $role !== 'admin') {
            fail('forbidden', 403);
        }
        $name = clean($b['displayName'] ?? $row['display_name'], 50);
        if ($name === '') {
            $name = $row['display_name'];
        }
        $suspended = array_key_exists('suspended', $b) ? (!empty($b['suspended']) ? 1 : 0) : (int) $row['suspended'];
        if ($id === (int) $user['id']) {
            $suspended = 0;
        }
        db()->exec('UPDATE users SET display_name = ?, role = ?, suspended = ? WHERE id = ?', [$name, $role, $suspended, $id]);
        if (!empty($b['password']) && strlen((string) $b['password']) >= 8) {
            db()->exec('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?', [hash_password((string) $b['password']), $id]);
        }
        ok(true);
    }
    if ($method === 'POST' && $path === '/admin/user/remove') {
        $id = (int) (body()['id'] ?? 0);
        if ($id === (int) $user['id'] || !db()->one('SELECT id FROM users WHERE id = ?', [$id])) {
            fail('forbidden', 403);
        }
        db()->exec(
            'UPDATE users SET email = NULL, phone = NULL, username = ?, display_name = ?, about = ?, avatar_file = NULL, suspended = 1, password_hash = ?, token_version = token_version + 1 WHERE id = ?',
            ['deleted' . $id, 'حذف‌شده', '', hash_password(bin2hex(random_bytes(16))), $id]
        );
        db()->exec('DELETE FROM chat_members WHERE user_id = ?', [$id]);
        db()->exec('DELETE FROM contacts WHERE owner_id = ? OR contact_id = ?', [$id, $id]);
        db()->exec('DELETE FROM blocks WHERE blocker_id = ? OR blocked_id = ?', [$id, $id]);
        db()->exec('DELETE FROM push_subs WHERE user_id = ?', [$id]);
        ok(true);
    }
    if ($method === 'GET' && $path === '/admin/reports') {
        ok(db()->all(
            'SELECT r.*, u.username AS reporter, t.username AS target FROM reports r
             LEFT JOIN users u ON u.id = r.reporter_id LEFT JOIN users t ON t.id = r.target_user_id
             ORDER BY r.id DESC LIMIT 80'
        ));
    }
    if ($method === 'POST' && $path === '/admin/reports') {
        $id = (int) (body()['id'] ?? 0);
        $status = (body()['status'] ?? '') === 'open' ? 'open' : 'closed';
        db()->exec('UPDATE reports SET status = ? WHERE id = ?', [$status, $id]);
        ok(true);
    }
    if ($method === 'GET' && $path === '/admin/groups') {
        ok(db()->all(
            'SELECT c.id, c.title, c.created_at, (SELECT COUNT(*) FROM chat_members m WHERE m.chat_id = c.id) AS members
             FROM chats c WHERE c.kind = ? ORDER BY c.id DESC LIMIT 80',
            ['group']
        ));
    }
    if ($method === 'POST' && $path === '/admin/groups/delete') {
        $id = (int) (body()['id'] ?? 0);
        $chat = db()->one('SELECT * FROM chats WHERE id = ? AND kind = ?', [$id, 'group']);
        if (!$chat) {
            fail('not_found', 404);
        }
        $ids = db()->all('SELECT id FROM messages WHERE chat_id = ?', [$id]);
        foreach ($ids as $row) {
            db()->exec('DELETE FROM message_hides WHERE message_id = ?', [(int) $row['id']]);
            db()->exec('DELETE FROM message_receipts WHERE message_id = ?', [(int) $row['id']]);
        }
        db()->exec('DELETE FROM messages WHERE chat_id = ?', [$id]);
        db()->exec('DELETE FROM chat_members WHERE chat_id = ?', [$id]);
        db()->exec('DELETE FROM typing WHERE chat_id = ?', [$id]);
        db()->exec('DELETE FROM chats WHERE id = ?', [$id]);
        ok(true);
    }
    if ($method === 'POST' && $path === '/admin/settings') {
        $b = body();
        if (array_key_exists('allowSignups', $b)) {
            db()->exec('UPDATE settings SET svalue = ? WHERE skey = ?', [!empty($b['allowSignups']) ? '1' : '0', 'allow_signups']);
        }
        if (array_key_exists('maxUpload', $b)) {
            $n = max(200000, min(20000000, (int) $b['maxUpload']));
            db()->exec('UPDATE settings SET svalue = ? WHERE skey = ?', [(string) $n, 'max_upload']);
        }
        ok(['allowSignups' => setting('allow_signups', '1') === '1', 'maxUpload' => max_upload()]);
    }
    if ($method === 'POST' && $path === '/admin/backup') {
        $file = write_backup(true);
        ok(['file' => basename($file)]);
    }
    fail('not_found', 404);
}

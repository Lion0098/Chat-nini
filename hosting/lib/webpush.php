<?php
declare(strict_types=1);

function webpush_send(string $endpoint, string $p256dh, string $auth, string $payload): int
{
    $ua = b64url_dec($p256dh);
    $secret = b64url_dec($auth);
    $privPem = base64_decode(setting('vapid_private'), true) ?: '';
    $pub = setting('vapid_public');
    if (strlen($ua) !== 65 || strlen($secret) < 16 || $privPem === '' || $pub === '') {
        return 0;
    }
    $sealed = webpush_seal($payload, $ua, substr($secret, 0, 16));
    if ($sealed === null) {
        return 0;
    }
    $parts = parse_url($endpoint);
    if (empty($parts['scheme']) || empty($parts['host'])) {
        return 0;
    }
    $aud = $parts['scheme'] . '://' . $parts['host'];
    $jwt = vapid_jwt($aud, $privPem);
    if ($jwt === '') {
        return 0;
    }
    if (!function_exists('curl_init')) {
        return 0;
    }
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $sealed['body'],
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/octet-stream',
            'Content-Encoding: aes128gcm',
            'TTL: 120',
            'Authorization: vapid t=' . $jwt . ',k=' . $pub,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 3,
    ]);
    curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return $code;
}

function webpush_seal(string $payload, string $uaPublic, string $auth): ?array
{
    $local = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
    if ($local === false) {
        return null;
    }
    $details = openssl_pkey_get_details($local);
    openssl_pkey_export($local, $pem);
    $asPublic = "\x04" . str_pad($details['ec']['x'], 32, "\0", STR_PAD_LEFT) . str_pad($details['ec']['y'], 32, "\0", STR_PAD_LEFT);
    $shared = openssl_pkey_derive(openssl_pkey_get_public(p256_point_pem($uaPublic)), $local, 32);
    if (!is_string($shared) || $shared === '') {
        return null;
    }
    $ikm = hash_hkdf('sha256', $shared, 32, "WebPush: info\0" . $uaPublic . $asPublic, $auth);
    $salt = random_bytes(16);
    $cek = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\0", $salt);
    $nonce = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\0", $salt);
    $tag = '';
    $cipher = openssl_encrypt($payload . "\2", 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag, '', 16);
    if ($cipher === false) {
        return null;
    }
    $body = $salt . pack('N', 4096) . chr(strlen($asPublic)) . $asPublic . $cipher . $tag;
    return ['body' => $body, 'pem' => $pem, 'public' => $asPublic];
}

function p256_point_pem(string $point): string
{
    $der = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200') . $point;
    return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END PUBLIC KEY-----\n";
}

function vapid_jwt(string $audience, string $privPem): string
{
    $header = b64url(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    $payload = b64url(json_encode([
        'aud' => $audience,
        'exp' => time() + 12 * 3600,
        'sub' => 'mailto:noreply@chat-nini.local',
    ]));
    $data = $header . '.' . $payload;
    $der = '';
    if (!openssl_sign($data, $der, $privPem, OPENSSL_ALGO_SHA256)) {
        return '';
    }
    $raw = ecdsa_der_raw($der);
    if ($raw === null) {
        return '';
    }
    return $data . '.' . b64url($raw);
}

function ecdsa_der_raw(string $der): ?string
{
    $offset = 0;
    if (ord($der[$offset++] ?? "\0") !== 0x30) {
        return null;
    }
    $len = ord($der[$offset++] ?? "\0");
    if ($len & 0x80) {
        $offset += $len & 0x7f;
    }
    if (ord($der[$offset++] ?? "\0") !== 0x02) {
        return null;
    }
    $rlen = ord($der[$offset++] ?? "\0");
    $r = substr($der, $offset, $rlen);
    $offset += $rlen;
    if (ord($der[$offset++] ?? "\0") !== 0x02) {
        return null;
    }
    $slen = ord($der[$offset++] ?? "\0");
    $s = substr($der, $offset, $slen);
    $r = ltrim($r, "\x00");
    $s = ltrim($s, "\x00");
    if (strlen($r) > 32 || strlen($s) > 32) {
        return null;
    }
    return str_pad($r, 32, "\0", STR_PAD_LEFT) . str_pad($s, 32, "\0", STR_PAD_LEFT);
}

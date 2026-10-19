<?php
declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (str_contains($uri, '..')) {
    http_response_code(400);
    return true;
}
if (str_starts_with($uri, '/api')) {
    require __DIR__ . '/api/index.php';
    return true;
}
if (preg_match('#^/(lib|storage)(/|$)#', $uri) || $uri === '/config.php') {
    http_response_code(404);
    return true;
}
$file = __DIR__ . $uri;
if ($uri !== '/' && is_file($file)) {
    return false;
}
header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__ . '/index.html');
return true;

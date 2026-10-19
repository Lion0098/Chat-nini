<?php
return [
    'debug' => false,
    'driver' => 'mysql',
    'sqlite' => __DIR__ . '/storage/app.sqlite',
    'mysql' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'chatnini',
        'user' => 'chatnini',
        'pass' => 'change-me',
    ],
    'key' => 'put-64-hex-chars-here',
    // Optional. Placeholders {phone} and {text}. Example Kavenegar:
    // 'https://api.kavenegar.com/v1/APIKEY/sms/send.json?receptor={phone}&sender=1000&message={text}'
    'sms_url' => '',
];

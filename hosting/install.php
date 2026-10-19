<?php
declare(strict_types=1);
if (is_file(__DIR__ . '/config.php') && empty($_GET['force'])) {
    exit('Already installed. Delete config.php to run the installer again.');
}
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $host = trim($_POST['host'] ?? 'localhost');
    $port = (int) ($_POST['port'] ?? 3306);
    $name = trim($_POST['name'] ?? '');
    $user = trim($_POST['user'] ?? '');
    $pass = (string) ($_POST['pass'] ?? '');
    $key = bin2hex(random_bytes(32));
    $php = "<?php\nreturn " . var_export([
        'debug' => false,
        'driver' => 'mysql',
        'sqlite' => __DIR__ . '/storage/app.sqlite',
        'mysql' => ['host' => $host, 'port' => $port, 'name' => $name, 'user' => $user, 'pass' => $pass],
        'key' => $key,
    ], true) . ";\n";
    file_put_contents(__DIR__ . '/config.php', $php, LOCK_EX);
    try {
        require __DIR__ . '/lib/bootstrap.php';
        db();
        echo 'نصب شد. install.php را حذف کنید و وارد سایت شوید.';
        exit;
    } catch (Throwable $e) {
        @unlink(__DIR__ . '/config.php');
        $error = $e->getMessage();
    }
}
?>
<!doctype html>
<html lang="fa" dir="rtl">
<meta charset="utf-8">
<title>نصب چت‌نینی</title>
<body style="font-family:tahoma;max-width:480px;margin:40px auto">
<h1>نصب روی MySQL</h1>
<?php if ($error) echo '<p style="color:#a00">' . htmlspecialchars($error) . '</p>'; ?>
<form method="post">
  <p>هاست<br><input name="host" value="localhost"></p>
  <p>پورت<br><input name="port" value="3306"></p>
  <p>نام دیتابیس<br><input name="name" required></p>
  <p>کاربر<br><input name="user" required></p>
  <p>رمز<br><input name="pass" type="password"></p>
  <button>ساخت جدول‌ها</button>
</form>
<p>در cPanel یک دیتابیس MySQL بسازید، این پوشه را در public_html بگذارید و این صفحه را باز کنید. بعد کرون روزانه <code>php cron/tick.php</code> را اضافه کنید.</p>
</body>

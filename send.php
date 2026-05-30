<?php
/* =========================================================
   Банний набір для «незайманої» — приймання заявок у Telegram
   ---------------------------------------------------------
   НАЛАШТУВАННЯ (2 кроки):
   1) Створіть бота у @BotFather → отримайте токен виду
      123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   2) Дізнайтеся свій CHAT_ID:
      - напишіть боту будь-яке повідомлення,
      - відкрийте https://api.telegram.org/bot<ТОКЕН>/getUpdates
      - знайдіть "chat":{"id": ... } — це і є CHAT_ID
        (для групи id буде з мінусом, напр. -1001234567890).
   Підставте обидва значення нижче. Файл має лежати поруч з index.html
   на хостингу з підтримкою PHP.
   ========================================================= */

const BOT_TOKEN = 'PASTE_YOUR_BOT_TOKEN_HERE';
const CHAT_ID   = 'PASTE_YOUR_CHAT_ID_HERE';

header('Content-Type: application/json; charset=utf-8');

function out($ok, $error = null) {
    if (!$ok) { http_response_code($error === 'config' ? 500 : 422); }
    echo json_encode(['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(false, 'method');
}

// Honeypot — заповнене лише ботами
if (!empty($_POST['website'])) {
    // вдаємо успіх, щоб не підказувати боту
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

if (BOT_TOKEN === 'PASTE_YOUR_BOT_TOKEN_HERE' || CHAT_ID === 'PASTE_YOUR_CHAT_ID_HERE') {
    out(false, 'config');
}

$name    = trim($_POST['name'] ?? '');
$phone   = trim($_POST['phone'] ?? '');
$set     = trim($_POST['set'] ?? '');
$comment = trim($_POST['comment'] ?? '');

if ($name === '' || mb_strlen($name) < 2 || preg_replace('/\D/', '', $phone) === '') {
    out(false, 'validation');
}

// Обрізаємо занадто довгі значення
$name    = mb_substr($name, 0, 80);
$phone   = mb_substr($phone, 0, 40);
$set     = mb_substr($set, 0, 120);
$comment = mb_substr($comment, 0, 1000);

$esc = fn($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

$lines = [
    '🔥 <b>Нова заявка — Банний набір для «незайманої»</b>',
    '',
    '👤 <b>Ім\'я:</b> ' . $esc($name),
    '📞 <b>Телефон:</b> ' . $esc($phone),
];
if ($set !== '')     { $lines[] = '📦 <b>Набір:</b> ' . $esc($set); }
if ($comment !== '') { $lines[] = '📝 <b>Коментар:</b> ' . $esc($comment); }
$lines[] = '';
$lines[] = '🕒 ' . date('d.m.Y H:i');

$text = implode("\n", $lines);

$payload = http_build_query([
    'chat_id'                  => CHAT_ID,
    'text'                     => $text,
    'parse_mode'               => 'HTML',
    'disable_web_page_preview' => 'true',
]);

$url = 'https://api.telegram.org/bot' . BOT_TOKEN . '/sendMessage';

$ok = false;
if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_TIMEOUT        => 15,
    ]);
    curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $ok = $code === 200;
} else {
    // запасний варіант, якщо cURL вимкнено
    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/x-www-form-urlencoded',
        'content' => $payload,
        'timeout' => 15,
    ]]);
    $resp = @file_get_contents($url, false, $ctx);
    $ok = $resp !== false;
}

if ($ok) {
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'telegram'], JSON_UNESCAPED_UNICODE);
}

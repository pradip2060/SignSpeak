<?php
require_once 'env.php';

try {
    $dsn = "mysql:host={$DB_CONFIG['host']};dbname={$DB_CONFIG['dbname']};charset=utf8mb4";
    $pdo = new PDO($dsn, $DB_CONFIG['user'], $DB_CONFIG['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // エラーを例外で投げる
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // 連想配列で取得
        PDO::ATTR_EMULATE_PREPARES => false, // 実際のプリペアドステートメント使用
    ]);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
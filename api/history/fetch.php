<?php
require_once __DIR__ . '/../../db.php'; 

header("Content-Type: application/json; charset=UTF-8");
try {
    $sql = "SELECT id, gesture_text, translated_text, lang_code, created_at 
            FROM history 
            ORDER BY created_at DESC 
            LIMIT 50";

    $stmt = $pdo->query($sql); // クエリ実行
    $rows = $stmt->fetchAll(); // すべて取得


    echo json_encode(["success" => true, "data" => $rows], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Query failed"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => "Server error"]);
}

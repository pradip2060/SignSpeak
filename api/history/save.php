<?php
require_once __DIR__ . '/../../db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    // JSONデータを取得
    $raw = file_get_contents("php://input");
    // JSONを配列に変換
    $json = json_decode($raw, true);
    if (is_array($json)) {
        $gesture_text = $json['gesture_text'] ?? $gesture_text;
        $translated_text = $json['translated_text'] ?? $translated_text;
        $lang_code = $json['lang_code'] ?? $lang_code;
    }

    if (empty($gesture_text)) {
        echo json_encode(["success" => false, "error" => "Missing gesture_text"]);
        exit;
    }

    // --- INSERT クエリ実行 ---
    $sql = "INSERT INTO history (gesture_text, translated_text, lang_code) VALUES (?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    // SQL実行
    $isSuccess = $stmt->execute([$gesture_text, $translated_text, $lang_code]);
    if (!$isSuccess) {
        echo json_encode(["success" => false, "error" => "Insert failed"]);
    } else {
        echo json_encode(["success" => true]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Database error"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => "Server error"]);
}

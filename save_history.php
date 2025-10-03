<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database configuration
$host = 'localhost';
$dbname = 'signspeak';
$username = 'root';
$password = '';

try {
    // Create connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get the posted data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['text'])) {
        echo json_encode(['success' => false, 'error' => 'No data received']);
        exit;
    }
    
    $text = $data['text'];
    $timestamp = isset($data['timestamp']) ? $data['timestamp'] : date('Y-m-d H:i:s');
    
    // Prepare SQL statement
    $stmt = $pdo->prepare("INSERT INTO history (text, timestamp) VALUES (?, ?)");
    $stmt->execute([$text, $timestamp]);
    
    echo json_encode(['success' => true, 'message' => 'History saved']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
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
    
    // Get history from database
    $stmt = $pdo->query("SELECT * FROM history ORDER BY timestamp DESC LIMIT 20");
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($history);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
<?php
header('Content-Type: text/plain');

$host = 'localhost';
$dbname = 'signspeak';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Database connection: SUCCESS\n";
    
    // Test insert
    $stmt = $pdo->prepare("INSERT INTO history (text, timestamp) VALUES (?, ?)");
    $stmt->execute(['Test from PHP', date('Y-m-d H:i:s')]);
    echo "Insert test: SUCCESS\n";
    
    // Test select
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM history");
    $result = $stmt->fetch();
    echo "Records in history table: " . $result['count'] . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
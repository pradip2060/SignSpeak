<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SignSpeak Real-time Web</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils"></script>
</head>

<body class="min-h-screen flex flex-col items-center p-4 relative">

    <div class="absolute top-4 right-4 flex flex-col sm:flex-row gap-2 z-10">
        <select id="lang-select" class="bg-white text-gray-800 border border-gray-600 rounded px-3 py-2 outline-none focus:border-green-500 transition-colors">
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
        </select>
    </div>

    <h1 class="text-xl font-semibold mt-2 tracking-wide uppercase text-gray-800">
        ASL Real-time Recognition
    </h1>

    <div id="status" class="text-sm mt-1 text-gray-800">
        Loading AI Model...
    </div>

    <div id="result" class="text-6xl md:text-7xl font-bold my-6 text-gray-800 h-20">
        ---
    </div>

    <div class="video-box w-full max-w-[854px] flex justify-center">
        <video id="input_video" class="hidden"></video>
        
        <canvas id="output_canvas" class="rounded-lg w-full h-auto aspect-video bg-black shadow-2xl">
        </canvas>
    </div>

    <script src="js/speak.js" defer></script>
    <script src="js/asl_recognize.js" defer></script>

</body>
</html>
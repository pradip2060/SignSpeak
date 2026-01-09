# TensorFlow.js モデル作成

## sign_speak_ml でモデル作成
```bash
python train_gesture.py
```

## sign_speak_ml でモデル作成
```bash
python train_gesture.py
```

Weight 用モデル(H5)が作成される
```bash
models/asl_weights_only.h5
```

## H5 Final モデル作成
```bash
python save_h5.py
```

モデル(H5)が作成される
```bash
models/asl_model_final.h5
```

## Model Convert
1. Google Colaboratory にアクセス

https://colab.research.google.com/


2. 左側のフォルダを開き、`asl_model_final.h5` をアップロード

3. Jupiter Notebook にコードを追加＆実行

```bash
# これがColabで実行する全コードです
!pip install tensorflowjs
!tensorflowjs_converter --input_format keras /content/asl_model_final.h5 /content/tfjs_model
import shutil
shutil.make_archive('tfjs_model', 'zip', '/content/tfjs_model')
```

4. `tfjs_model.zip` が作成されたらダウンロード

## Modelインストール    
1. `tfjs_model.zip` を解凍し、`tfjs_model/` にインストール

- model.json
- group1-shard2\1of1.bin

2. ブラウザで `asl_recognize.php` にアクセス
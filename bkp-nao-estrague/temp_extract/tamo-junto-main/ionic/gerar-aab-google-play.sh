#!/bin/bash
# Script para gerar Android App Bundle (AAB) para upload no Google Play Console
# O Google Play exige AAB (não APK) para novos apps desde agosto/2021

set -e

echo "=== Gerando AAB para Google Play ==="
echo ""

# 1. Build do Ionic
echo "1. Compilando aplicação Ionic..."
npm run build

# 2. Sincronizar com Capacitor
echo "2. Sincronizando com Android..."
npx cap sync android

# 3. Gerar AAB assinado
echo "3. Gerando Android App Bundle (AAB)..."
cd android
./gradlew bundleRelease
cd ..

# 4. Copiar AAB para pasta de saída com nome descritivo
AAB_ORIGEM="android/app/build/outputs/bundle/release/app-release.aab"
DATA=$(date +%Y%m%d-%H%M%S)
AAB_DESTINO="dist/tamo-junto-google-play-${DATA}.aab"

mkdir -p dist
cp "$AAB_ORIGEM" "$AAB_DESTINO"

echo ""
echo "=== Sucesso! ==="
echo "AAB gerado em: $AAB_DESTINO"
echo ""
echo "Próximos passos:"
echo "1. Acesse o Google Play Console"
echo "2. Vá em: Teste > Teste interno > Criar nova versão"
echo "3. Arraste o arquivo .aab (NÃO o .apk) na área de upload"
echo "4. Preencha o nome da versão (ex: v0.1) e notas da versão"
echo "5. Envie para revisão"
echo ""

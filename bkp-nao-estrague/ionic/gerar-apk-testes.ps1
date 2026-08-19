# Script para gerar APK de testes (Debug) para Android

Write-Host "=== Gerando APK para Testes ==="
Write-Host ""

# 1. Build do Ionic
Write-Host "1. Compilando aplicação Ionic..."
npm run build

# 2. Sincronizar com Capacitor
Write-Host "2. Sincronizando com Android..."
npx cap sync android

# 3. Gerar APK
Write-Host "3. Gerando APK (Debug)..."
Set-Location android
.\gradlew.bat assembleDebug
Set-Location ..

# 4. Copiar APK para pasta de saída com nome descritivo
$apkOrigem = "android\app\build\outputs\apk\debug\app-debug.apk"
$data = Get-Date -Format "yyyyMMdd-HHmmss"
$apkDestino = "tamo-junto-debug-$data.apk"

If (Test-Path $apkOrigem) {
    Copy-Item $apkOrigem -Destination $apkDestino
    Write-Host ""
    Write-Host "=== Sucesso! ==="
    Write-Host "APK gerado na pasta 'ionic' com o nome: $apkDestino"
    Write-Host "Você já pode enviar esse arquivo para o seu celular Android e instalar."
} Else {
    Write-Host ""
    Write-Host "=== Erro! ==="
    Write-Host "Não foi possível encontrar o APK gerado. Verifique os logs acima para entender o que falhou na compilação do Android."
}

Write-Host ""
pause

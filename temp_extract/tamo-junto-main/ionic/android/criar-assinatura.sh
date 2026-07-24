#!/bin/bash

# Script para criar keystore e configurar assinatura do APK
# Execute: bash criar-assinatura.sh

echo "=========================================="
echo "🔐 Configuração de Assinatura do APK"
echo "=========================================="
echo ""

# Verificar se já existe keystore
if [ -f "tamo-junto-release-key.jks" ]; then
    echo "⚠️  ATENÇÃO: Já existe uma keystore!"
    read -p "Deseja sobrescrever? (s/N): " resposta
    if [ "$resposta" != "s" ] && [ "$resposta" != "S" ]; then
        echo "Operação cancelada."
        exit 0
    fi
fi

echo "Vamos criar sua keystore (chave de assinatura)."
echo "Você precisará fornecer algumas informações:"
echo ""
echo "📋 Informações necessárias:"
echo "  - Senha da keystore (escolha uma senha forte)"
echo "  - Nome completo ou nome da empresa"
echo "  - Organização/Departamento"
echo "  - Cidade"
echo "  - Estado"
echo "  - Código do país (BR para Brasil)"
echo ""
read -p "Pressione ENTER para continuar..."

# Criar keystore
echo ""
echo "🔑 Criando keystore..."
keytool -genkey -v -keystore tamo-junto-release-key.jks \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias tamo-junto-key

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore criada com sucesso!"
    echo ""
    
    # Criar arquivo keystore.properties
    echo "📝 Criando arquivo de configuração..."
    echo ""
    read -sp "Digite a senha da keystore novamente: " STORE_PASSWORD
    echo ""
    read -sp "Confirme a senha da keystore: " STORE_PASSWORD_CONFIRM
    echo ""
    
    if [ "$STORE_PASSWORD" != "$STORE_PASSWORD_CONFIRM" ]; then
        echo "❌ Erro: As senhas não coincidem!"
        exit 1
    fi
    
    KEY_PASSWORD="$STORE_PASSWORD"
    
    cat > keystore.properties << EOF
storeFile=../tamo-junto-release-key.jks
storePassword=$STORE_PASSWORD
keyAlias=tamo-junto-key
keyPassword=$KEY_PASSWORD
EOF
    
    echo "✅ Arquivo keystore.properties criado!"
    echo ""
    echo "=========================================="
    echo "✅ Configuração concluída!"
    echo "=========================================="
    echo ""
    echo "📦 Agora você pode gerar o APK assinado com:"
    echo "   ./gradlew assembleRelease"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   - Guarde a senha em local seguro!"
    echo "   - Faça backup do arquivo tamo-junto-release-key.jks"
    echo "   - Se perder a keystore ou senha, não poderá atualizar o app na Play Store!"
    echo ""
else
    echo ""
    echo "❌ Erro ao criar keystore!"
    exit 1
fi




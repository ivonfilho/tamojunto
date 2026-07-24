#!/bin/bash

# Script automatizado para criar keystore com valores padrão
# ATENÇÃO: Este script usa valores padrão. Para produção, use criar-assinatura.sh

echo "=========================================="
echo "🔐 Criando Keystore Automática"
echo "=========================================="
echo ""

KEYSTORE_FILE="tamo-junto-release-key.jks"
KEYSTORE_PASSWORD="TamoJunto2024!@#"
KEY_ALIAS="tamo-junto-key"

# Verificar se já existe
if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  Keystore já existe: $KEYSTORE_FILE"
    read -p "Deseja sobrescrever? (s/N): " resposta
    if [ "$resposta" != "s" ] && [ "$resposta" != "S" ]; then
        echo "Operação cancelada."
        exit 0
    fi
    rm -f "$KEYSTORE_FILE"
fi

echo "Criando keystore com valores padrão..."
echo "Keystore: $KEYSTORE_FILE"
echo "Alias: $KEY_ALIAS"
echo ""

# Criar keystore com valores padrão usando expect ou entrada não-interativa
# Como keytool não aceita entrada não-interativa facilmente, vamos usar um método alternativo

# Método: criar via keytool com entrada redirecionada
# Nota: keytool ainda pedirá confirmação da senha, então precisamos usar expect ou valores via stdin

cat << EOF | keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias "$KEY_ALIAS" \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEYSTORE_PASSWORD" \
    -dname "CN=Tamo Junto, OU=Desenvolvimento, O=Tamo Junto, L=Sao Paulo, ST=SP, C=BR" 2>&1

EOF

if [ -f "$KEYSTORE_FILE" ]; then
    echo ""
    echo "✅ Keystore criada com sucesso!"
    echo ""
    
    # Criar keystore.properties
    cat > keystore.properties << EOF
storeFile=../tamo-junto-release-key.jks
storePassword=$KEYSTORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEYSTORE_PASSWORD
EOF
    
    echo "✅ Arquivo keystore.properties criado!"
    echo ""
    echo "📝 Informações da keystore:"
    echo "   Arquivo: $KEYSTORE_FILE"
    echo "   Alias: $KEY_ALIAS"
    echo "   Senha: $KEYSTORE_PASSWORD"
    echo ""
    echo "⚠️  IMPORTANTE: Guarde essas informações em local seguro!"
    echo ""
    echo "✅ Pronto! Agora você pode gerar o APK assinado."
else
    echo ""
    echo "❌ Erro ao criar keystore!"
    exit 1
fi




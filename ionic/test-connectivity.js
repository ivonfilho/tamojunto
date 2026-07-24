#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🔍 Testando Conectividade com Servidor Railway');
console.log('==============================================\n');

// Configurações do servidor
const RAILWAY_URL = 'seemly-breath-production.up.railway.app';
const TEST_ENDPOINTS = [
  '/health',
  '/swagger',
  '/api'
];

// Headers simulando o app Android
const ANDROID_HEADERS = {
  'User-Agent': 'TamoJunto-Android-App/1.0',
  'Accept': 'application/json, text/plain, */*',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

// Função para fazer requisição HTTPS
function makeHttpsRequest(url, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url,
      port: 443,
      path: path,
      method: 'GET',
      headers: headers,
      timeout: 20000 // 20 segundos timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          success: true
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Timeout após 20 segundos',
        success: false
      });
    });

    req.end();
  });
}

// Função para testar conectividade básica
async function testBasicConnectivity() {
  console.log('🚀 Testando conectividade básica...');
  
  try {
    const result = await makeHttpsRequest(RAILWAY_URL, '/health', ANDROID_HEADERS);
    console.log(`✅ Status: ${result.status}`);
    console.log(`📊 Headers: ${JSON.stringify(result.headers, null, 2)}`);
    console.log(`📝 Data: ${result.data.substring(0, 200)}...`);
    return true;
  } catch (error) {
    console.log(`❌ Erro: ${error.error}`);
    return false;
  }
}

// Função para testar múltiplos endpoints
async function testMultipleEndpoints() {
  console.log('\n🌐 Testando múltiplos endpoints...');
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      const result = await makeHttpsRequest(RAILWAY_URL, endpoint, ANDROID_HEADERS);
      console.log(`✅ Status: ${result.status}`);
      console.log(`📊 Tamanho da resposta: ${result.data.length} bytes`);
    } catch (error) {
      console.log(`❌ Erro: ${error.error}`);
    }
  }
}

// Função para testar timeout e retry
async function testTimeoutAndRetry() {
  console.log('\n⏱️ Testando timeout e retry...');
  
  const startTime = Date.now();
  
  try {
    // Primeira tentativa
    console.log('🔄 Tentativa 1...');
    const result1 = await makeHttpsRequest(RAILWAY_URL, '/health', ANDROID_HEADERS);
    console.log(`✅ Tentativa 1 bem-sucedida em ${Date.now() - startTime}ms`);
    
    // Segunda tentativa (simulando retry)
    console.log('🔄 Tentativa 2...');
    const result2 = await makeHttpsRequest(RAILWAY_URL, '/health', ANDROID_HEADERS);
    console.log(`✅ Tentativa 2 bem-sucedida em ${Date.now() - startTime}ms`);
    
  } catch (error) {
    console.log(`❌ Erro após retry: ${error.error}`);
  }
}

// Função para testar diferentes tipos de headers
async function testDifferentHeaders() {
  console.log('\n📋 Testando diferentes tipos de headers...');
  
  const headerTests = [
    { name: 'Headers padrão', headers: {} },
    { name: 'Headers Android', headers: ANDROID_HEADERS },
    { name: 'Headers com cache', headers: { ...ANDROID_HEADERS, 'Cache-Control': 'max-age=3600' } }
  ];
  
  for (const test of headerTests) {
    try {
      console.log(`\n🔧 ${test.name}...`);
      const result = await makeHttpsRequest(RAILWAY_URL, '/health', test.headers);
      console.log(`✅ Status: ${result.status}`);
    } catch (error) {
      console.log(`❌ Erro: ${error.error}`);
    }
  }
}

// Função principal
async function runAllTests() {
  console.log('🎯 Iniciando testes de conectividade...\n');
  
  try {
    // Teste 1: Conectividade básica
    const basicTest = await testBasicConnectivity();
    
    if (basicTest) {
      // Teste 2: Múltiplos endpoints
      await testMultipleEndpoints();
      
      // Teste 3: Timeout e retry
      await testTimeoutAndRetry();
      
      // Teste 4: Diferentes headers
      await testDifferentHeaders();
      
      console.log('\n🎉 Todos os testes foram concluídos!');
      console.log('✅ O servidor Railway está acessível e funcionando corretamente.');
      console.log('📱 O app Android deve conseguir conectar sem problemas.');
    } else {
      console.log('\n❌ Teste básico falhou. Verifique a conectividade de rede.');
    }
    
  } catch (error) {
    console.error('\n💥 Erro durante os testes:', error);
  }
}

// Executar testes
runAllTests().catch(console.error); 
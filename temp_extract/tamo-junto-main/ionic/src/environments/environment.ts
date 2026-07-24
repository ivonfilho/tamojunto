// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'https://seemly-breath-production.up.railway.app'
};

export let SERVER_URL = 'https://seemly-breath-production.up.railway.app';

// Sistema de fallback de API para resolver problemas de conectividade
export const API_FALLBACK_URLS = [
  'https://seemly-breath-production.up.railway.app',  // Railway (principal)
  'https://app.tamojunto.net:8081',                  // Hostinger (fallback)
  'http://localhost:5000'                            // Local (desenvolvimento)
];

// Log para debug
console.log('[Environment] 🚀 Configuração do ambiente carregada');
console.log('[Environment] 🌐 API URL configurada:', environment.apiUrl);
console.log('[Environment] 🌍 Server URL configurada:', SERVER_URL);
console.log('[Environment] 📱 Produção:', environment.production);
console.log('[Environment] 🔄 URLs de fallback:', API_FALLBACK_URLS);
console.log('[Environment] 🔍 Verificando conectividade...');

// Teste de conectividade com fallback
export async function testApiConnectivity(): Promise<string> {
  for (const url of API_FALLBACK_URLS) {
    try {
      console.log(`[Environment] 🔍 Testando conectividade com: ${url}`);
      const response = await fetch(url + '/health', { 
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        console.log(`[Environment] ✅ API funcionando: ${url}`);
        return url;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.log(`[Environment] ❌ API não responde: ${url} - ${errorMessage}`);
    }
  }
  
  // Se nenhuma API funcionar, retorna a principal
  console.log('[Environment] ⚠️ Nenhuma API funcionando, usando URL principal');
  return environment.apiUrl;
}

// Teste automático de conectividade
testApiConnectivity().then(workingUrl => {
  if (workingUrl !== environment.apiUrl) {
    console.log(`[Environment] 🔄 Usando API alternativa: ${workingUrl}`);
    // Atualizar a URL da API dinamicamente
    environment.apiUrl = workingUrl;
    SERVER_URL = workingUrl;
  }
}).catch(error => {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  console.error('[Environment] ❌ Erro no teste de conectividade:', errorMessage);
});

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

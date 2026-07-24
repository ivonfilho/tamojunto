export const environment = {
  production: true,
  apiUrl: 'https://seemly-breath-production.up.railway.app'
};

// Sistema de fallback de API para produção
export const API_FALLBACK_URLS = [
  'https://seemly-breath-production.up.railway.app',  // Railway (principal)
  'https://app.tamojunto.net:8081'                   // Hostinger (fallback)
];

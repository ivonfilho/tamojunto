import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.tamojunto.app',
  appName: 'tamo-junto',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'https://seemly-breath-production.up.railway.app/*',
      'https://*.railway.app/*',
      'https://*.up.railway.app/*',
      'https://app.tamojunto.net/*',
      'https://cdnjs.cloudflare.com/*'
    ]
  },
  android: {
    // Configurações específicas para resolver problemas de conectividade
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    // Configurações para iOS
    scheme: 'https',
    webContentsDebuggingEnabled: true
  },
  plugins: {
    // Configurações de plugins para melhorar conectividade
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#3880ff",
      showSpinner: true,
      spinnerColor: "#999999"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3880ff'
    }
  }
};

export default config;

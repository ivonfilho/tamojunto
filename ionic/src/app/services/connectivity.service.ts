import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {

  constructor(private http: HttpClient) { }

  /**
   * Teste simples de conectividade usando fetch nativo
   */
  async testConnectivityWithFetch(): Promise<any> {
    try {
      console.log('[Connectivity Service] 🔍 Testando conectividade com fetch nativo...');
      console.log('[Connectivity Service] 🌐 URL:', environment.apiUrl + '/health');
      
      const response = await fetch(environment.apiUrl + '/health', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[Connectivity Service] ✅ Resposta recebida:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Connectivity Service] 📊 Dados recebidos:', data);
        return { success: true, data };
      } else {
        console.log('[Connectivity Service] ❌ Erro HTTP:', response.status, response.statusText);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error: any) {
      console.error('[Connectivity Service] 🚨 Erro no teste de conectividade:', error);
      return { success: false, error: error.message || 'Erro desconhecido' };
    }
  }

  /**
   * Teste de conectividade usando HttpClient
   */
  testConnectivityWithHttpClient(): Observable<any> {
    console.log('[Connectivity Service] 🔍 Testando conectividade com HttpClient...');
    
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    return this.http.get(environment.apiUrl + '/health', { headers }).pipe(
      timeout(10000), // 10 segundos de timeout
      catchError(error => {
        console.error('[Connectivity Service] 🚨 Erro no HttpClient:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Teste de conectividade básico
   */
  async testBasicConnectivity(): Promise<any> {
    try {
      console.log('[Connectivity Service] 🔍 Teste básico de conectividade...');
      console.log('[Connectivity Service] 📱 User Agent:', navigator.userAgent);
      console.log('[Connectivity Service] 🌍 Platform:', navigator.platform);
      console.log('[Connectivity Service] 🔗 Online:', navigator.onLine);
      
      // Teste simples de DNS
      const startTime = Date.now();
      const response = await fetch(environment.apiUrl + '/health');
      const endTime = Date.now();
      
      console.log('[Connectivity Service] ⏱️ Tempo de resposta:', endTime - startTime, 'ms');
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          data,
          responseTime: endTime - startTime,
          status: response.status,
          statusText: response.statusText
        };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          statusText: response.statusText
        };
      }
    } catch (error: any) {
      console.error('[Connectivity Service] 🚨 Erro no teste básico:', error);
      return { 
        success: false, 
        error: error.message || 'Erro desconhecido',
        type: error.constructor.name
      };
    }
  }

  /**
   * Teste específico para Android com diferentes abordagens
   */
  async testAndroidConnectivity(): Promise<any> {
    try {
      console.log('[Connectivity Service] 🔍 Teste específico para Android...');
      
      // Teste 1: Fetch básico
      console.log('[Connectivity Service] 📱 Teste 1: Fetch básico');
      const result1 = await this.testBasicConnectivity();
      
      // Teste 2: Fetch com headers específicos
      console.log('[Connectivity Service] 📱 Teste 2: Fetch com headers específicos');
      const result2 = await this.testConnectivityWithFetch();
      
      // Teste 3: Verificação de ambiente
      console.log('[Connectivity Service] 📱 Teste 3: Verificação de ambiente');
      const envInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        online: navigator.onLine,
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt
        } : 'N/A',
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack
      };
      
      console.log('[Connectivity Service] 📊 Informações do ambiente:', envInfo);
      
      return {
        success: result1.success || result2.success,
        tests: {
          basic: result1,
          withHeaders: result2,
          environment: envInfo
        },
        summary: {
          basicWorking: result1.success,
          headersWorking: result2.success,
          isAndroid: /Android/i.test(navigator.userAgent),
          isOnline: navigator.onLine
        }
      };
      
    } catch (error: any) {
      console.error('[Connectivity Service] 🚨 Erro no teste Android:', error);
      return { 
        success: false, 
        error: error.message || 'Erro desconhecido',
        type: error.constructor.name
      };
    }
  }

  /**
   * Teste de conectividade com timeout personalizado
   */
  async testConnectivityWithTimeout(timeoutMs: number = 5000): Promise<any> {
    try {
      console.log(`[Connectivity Service] ⏱️ Teste com timeout de ${timeoutMs}ms...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const startTime = Date.now();
      const response = await fetch(environment.apiUrl + '/health', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Platform': 'Android',
          'X-Capacitor': 'true'
        }
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      
      console.log('[Connectivity Service] ✅ Resposta recebida:', response.status, response.statusText);
      console.log('[Connectivity Service] ⏱️ Tempo de resposta:', endTime - startTime, 'ms');
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          data,
          responseTime: endTime - startTime,
          status: response.status,
          statusText: response.statusText
        };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          statusText: response.statusText
        };
      }
    } catch (error: any) {
      console.error('[Connectivity Service] 🚨 Erro no teste com timeout:', error);
      
      if (error.name === 'AbortError') {
        return { 
          success: false, 
          error: 'Timeout - A requisição demorou muito para responder',
          type: 'timeout',
          timeoutMs
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Erro desconhecido',
        type: error.constructor.name
      };
    }
  }
} 

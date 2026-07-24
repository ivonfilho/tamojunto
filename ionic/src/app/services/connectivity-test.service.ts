import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, timeout, retry, delay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityTestService {

  constructor(private http: HttpClient) {}

  /**
   * Testa a conectividade básica com o servidor Railway
   * Configurações específicas para resolver problemas de APK Android
   */
  testBasicConnectivity(): Observable<any> {
    const url = `${environment.apiUrl}/health`;
    console.log('[Connectivity Test] 🚀 Testing basic connectivity to Railway server:', url);
    console.log('[Connectivity Test] 📍 Environment API URL:', environment.apiUrl);
    console.log('[Connectivity Test] 🌐 Current location:', window.location.href);
    console.log('[Connectivity Test] 📱 User Agent:', navigator.userAgent);
    console.log('[Connectivity Test] 🔒 Protocol:', window.location.protocol);
    console.log('[Connectivity Test] 🌍 Online status:', navigator.onLine);
    
    // Headers específicos para resolver problemas de conectividade Android
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    // Usar fetch nativo para evitar interceptors
    return new Observable(observer => {
      console.log('[Connectivity Test] 🔍 Usando fetch nativo para evitar interceptors');
      console.log('[Connectivity Test] 📋 Headers configurados:', headers);
      
      // Teste de DNS antes da requisição
      this.testDNSResolutionDetailed(url).then(dnsResult => {
        console.log('[Connectivity Test] 🌐 DNS Test Result:', dnsResult);
      });
      
      // Teste de certificado SSL
      this.testSSLCertificate(url).then(sslResult => {
        console.log('[Connectivity Test] 🔒 SSL Certificate Test Result:', sslResult);
      });
      
      // Teste de conectividade de rede
      this.testNetworkConnectivityDetailed().then(networkResult => {
        console.log('[Connectivity Test] 🌍 Network Connectivity Test Result:', networkResult);
      });
      
      console.log('[Connectivity Test] 🚀 Iniciando requisição fetch para:', url);
      console.log('[Connectivity Test] ⏰ Timestamp início:', new Date().toISOString());
      
      fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'Cache-Control': 'no-cache'
        }
      })
      .then(response => {
        console.log('[Connectivity Test] ✅ Fetch response received:', response);
        console.log('[Connectivity Test] 📊 Response status:', response.status);
        console.log('[Connectivity Test] 📊 Response statusText:', response.statusText);
        console.log('[Connectivity Test] 📊 Response ok:', response.ok);
        console.log('[Connectivity Test] 📊 Response type:', response.type);
        console.log('[Connectivity Test] 📊 Response url:', response.url);
        console.log('[Connectivity Test] 📊 Response headers:', response.headers);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      })
      .then(data => {
        console.log('[Connectivity Test] ✅ Railway server connection successful:', data);
        console.log('[Connectivity Test] ⏰ Timestamp sucesso:', new Date().toISOString());
        observer.next({ 
          success: true, 
          data: data, 
          status: 200,
          error: null 
        });
        observer.complete();
      })
      .catch(error => {
        console.error('[Connectivity Test] ❌ Railway server connection failed:', error);
        console.log('[Connectivity Test] ⏰ Timestamp erro:', new Date().toISOString());
        console.log('[Connectivity Test] 🚨 Error name:', error.name);
        console.log('[Connectivity Test] 🚨 Error message:', error.message);
        console.log('[Connectivity Test] 🚨 Error stack:', error.stack);
        console.log('[Connectivity Test] 🚨 Error constructor:', error.constructor.name);
        
        // Análise detalhada do erro para diagnóstico
        let errorDetails = {
          status: 0,
          message: error.message,
          url: url,
          name: error.name,
          type: 'unknown'
        };
        
        // Classificação detalhada do tipo de erro
        if (error.message.includes('Failed to fetch')) {
          errorDetails.type = 'network_error';
          errorDetails.message = 'Erro de rede - Verifique a conexão com a internet';
          console.log('[Connectivity Test] 🔍 Erro classificado como: NETWORK_ERROR');
          console.log('[Connectivity Test] 🔍 Possíveis causas:');
          console.log('[Connectivity Test]   - Sem conexão com a internet');
          console.log('[Connectivity Test]   - Firewall bloqueando a conexão');
          console.log('[Connectivity Test]   - Problema de DNS');
          console.log('[Connectivity Test]   - Certificado SSL inválido');
          console.log('[Connectivity Test]   - CORS bloqueando a requisição');
        } else if (error.message.includes('timeout')) {
          errorDetails.type = 'timeout_error';
          errorDetails.message = 'Timeout de conexão - Servidor não respondeu a tempo';
          console.log('[Connectivity Test] 🔍 Erro classificado como: TIMEOUT_ERROR');
        } else if (error.message.includes('HTTP 404')) {
          errorDetails.type = 'endpoint_not_found';
          errorDetails.message = 'Endpoint não encontrado no servidor Railway';
          console.log('[Connectivity Test] 🔍 Erro classificado como: ENDPOINT_NOT_FOUND');
        } else if (error.message.includes('HTTP 500')) {
          errorDetails.type = 'server_error';
          errorDetails.message = 'Erro interno do servidor Railway';
          console.log('[Connectivity Test] 🔍 Erro classificado como: SERVER_ERROR');
        } else if (error.message.includes('HTTP 403')) {
          errorDetails.type = 'forbidden';
          errorDetails.message = 'Acesso negado pelo servidor Railway';
          console.log('[Connectivity Test] 🔍 Erro classificado como: FORBIDDEN');
        } else if (error.message.includes('SSL')) {
          errorDetails.type = 'ssl_error';
          errorDetails.message = 'Erro de certificado SSL - Problema de segurança';
          console.log('[Connectivity Test] 🔍 Erro classificado como: SSL_ERROR');
        } else if (error.message.includes('CORS')) {
          errorDetails.type = 'cors_error';
          errorDetails.message = 'Erro de CORS - Política de origem cruzada';
          console.log('[Connectivity Test] 🔍 Erro classificado como: CORS_ERROR');
        }
        
        console.log('[Connectivity Test] 📋 Error details final:', errorDetails);
        
        observer.next({ 
          success: false, 
          error: errorDetails,
          details: `Status: ${errorDetails.status}, Message: ${errorDetails.message}, Type: ${errorDetails.type}`
        });
        observer.complete();
      });
    });
  }

  /**
   * Teste detalhado de resolução DNS
   */
  private async testDNSResolutionDetailed(url: string): Promise<any> {
    try {
      console.log('[DNS Test] 🌐 Testing DNS resolution for:', url);
      
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      console.log('[DNS Test] 🏠 Domain extracted:', domain);
      
      // Teste usando fetch com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://${domain}/health`, {
        signal: controller.signal,
        method: 'HEAD' // Apenas verificar se responde
      });
      
      clearTimeout(timeoutId);
      
      console.log('[DNS Test] ✅ DNS resolution successful for:', domain);
      return {
        success: true,
        domain: domain,
        resolved: true,
        status: response.status
      };
    } catch (error) {
      console.error('[DNS Test] ❌ DNS resolution failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        domain: url,
        resolved: false,
        error: errorMessage
      };
    }
  }

  /**
   * Teste de certificado SSL
   */
  private async testSSLCertificate(url: string): Promise<any> {
    try {
      console.log('[SSL Test] 🔒 Testing SSL certificate for:', url);
      
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Teste de certificado usando fetch
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors'
      });
      
      console.log('[SSL Test] ✅ SSL certificate valid for:', domain);
      return {
        success: true,
        domain: domain,
        sslValid: true,
        status: response.status
      };
    } catch (error) {
      console.error('[SSL Test] ❌ SSL certificate test failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      let sslError = 'unknown';
      if (errorMessage.includes('SSL')) sslError = 'ssl_certificate_error';
      else if (errorMessage.includes('certificate')) sslError = 'ssl_certificate_error';
      else if (errorMessage.includes('security')) sslError = 'security_error';
      
      return {
        success: false,
        domain: url,
        sslValid: false,
        error: errorMessage,
        sslErrorType: sslError
      };
    }
  }

  /**
   * Teste detalhado de conectividade de rede
   */
  private async testNetworkConnectivityDetailed(): Promise<any> {
    console.log('[Network Test] 🌍 Testing general network connectivity');
    
    const testUrls = [
      'https://www.google.com',
      'https://httpbin.org/get',
      'https://seemly-breath-production.up.railway.app/health'
    ];
    
    const results = [];
    
    for (const url of testUrls) {
      try {
        console.log('[Network Test] 🔍 Testing URL:', url);
        const startTime = Date.now();
        
        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            'Accept': 'application/json, text/plain, */*'
          }
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log('[Network Test] ✅ Success for:', url, 'Response time:', responseTime + 'ms');
        
        results.push({
          url: url,
          success: true,
          status: response.status,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[Network Test] ❌ Failed for:', url, 'Error:', errorMessage);
        
        results.push({
          url: url,
          success: false,
          status: 0,
          error: errorMessage,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('[Network Test] 📊 All network test results:', results);
    return results;
  }

  /**
   * Testa a conectividade com autenticação
   * Configurações específicas para APK Android
   */
  testAuthenticatedConnectivity(): Observable<any> {
    const url = `${environment.apiUrl}/api/cliente`;
    console.log('[Connectivity Test] 🔐 Testing authenticated connectivity to Railway:', url);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Cache-Control': 'no-cache'
    });

    return this.http.get(url, { 
      headers,
      observe: 'response',
      responseType: 'json'
    }).pipe(
      timeout(15000), // 15 segundos timeout
      retry(2), // Tenta 2 vezes
      map(response => {
        console.log('[Connectivity Test] ✅ Authenticated connection successful:', response);
        return { 
          success: true, 
          data: response.body, 
          status: response.status,
          error: null 
        };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[Connectivity Test] ❌ Authenticated connection failed:', error);
        return of({ 
          success: false, 
          error: {
            status: error.status,
            message: error.message,
            url: error.url,
            name: error.name,
            type: error.status === 401 ? 'unauthorized' : 'other'
          }
        });
      })
    );
  }

  /**
   * Testa diferentes endpoints para diagnosticar problemas específicos do Railway
   */
  testMultipleEndpoints(): Observable<any[]> {
    const endpoints = [
      { name: 'Health Check', url: `${environment.apiUrl}/health`, expectedStatus: 200 },
      { name: 'Swagger', url: `${environment.apiUrl}/swagger`, expectedStatus: 200 },
      { name: 'API Base', url: `${environment.apiUrl}/api`, expectedStatus: 200 },
      { name: 'Cliente API', url: `${environment.apiUrl}/api/cliente`, expectedStatus: 401 }
    ];

    const tests = endpoints.map(endpoint => 
      this.http.get(endpoint.url, {
        headers: new HttpHeaders({
          'Accept': 'application/json, text/plain, */*'
        }),
        observe: 'response',
        responseType: 'text'
      }).pipe(
        timeout(10000),
        map(response => ({
          name: endpoint.name,
          url: endpoint.url,
          success: true,
          status: response.status,
          expectedStatus: endpoint.expectedStatus,
          data: response.body,
          isExpectedStatus: response.status === endpoint.expectedStatus
        })),
        catchError(error => of({
          name: endpoint.name,
          url: endpoint.url,
          success: false,
          status: error.status || 0,
          expectedStatus: endpoint.expectedStatus,
          error: error.message,
          isExpectedStatus: false
        }))
      )
    );

    return of(tests).pipe(
      // Executa todos os testes em paralelo
      map(() => tests)
    );
  }

  /**
   * Testa especificamente a conectividade com o servidor Railway
   * Inclui verificações de DNS e certificados SSL
   */
  testRailwayConnectivity(): Observable<any> {
    const railwayUrl = 'https://seemly-breath-production.up.railway.app';
    console.log('[Railway Test] 🚂 Testing specific Railway server connectivity:', railwayUrl);
    
    const headers = new HttpHeaders({
      'Accept': 'application/json, text/plain, */*',
      'Cache-Control': 'no-cache'
    });
    
    return this.http.get(`${railwayUrl}/health`, { 
      headers,
      observe: 'response',
      responseType: 'json'
    }).pipe(
      timeout(25000), // 25 segundos para servidores Railway
      retry(2),
      map(response => {
        console.log('[Railway Test] ✅ Railway server is accessible:', response);
        return {
          success: true,
          server: 'Railway',
          url: railwayUrl,
          status: response.status,
          responseTime: new Date().toISOString(),
          data: response.body
        };
      }),
      catchError(error => {
        console.error('[Railway Test] ❌ Railway server connectivity failed:', error);
        return of({ 
          success: false, 
          server: 'Railway',
          url: railwayUrl,
          error: {
            status: error.status || 0,
            message: error.message,
            type: this.classifyRailwayError(error)
          },
          timestamp: new Date().toISOString()
        });
      })
    );
  }

  /**
   * Classifica erros específicos do Railway para melhor diagnóstico
   */
  private classifyRailwayError(error: any): string {
    if (error.status === 0) return 'network_timeout';
    if (error.status === 404) return 'railway_endpoint_not_found';
    if (error.status === 500) return 'railway_server_error';
    if (error.status === 502) return 'railway_bad_gateway';
    if (error.status === 503) return 'railway_service_unavailable';
    if (error.status === 504) return 'railway_gateway_timeout';
    return 'unknown_railway_error';
  }

  /**
   * Testa a resolução de DNS para o servidor Railway
   */
  testDNSResolution(): Observable<any> {
    const domain = 'seemly-breath-production.up.railway.app';
    console.log('[DNS Test] 🌐 Testing DNS resolution for Railway domain:', domain);
    
    // Simula teste de DNS usando uma requisição HTTP simples
    return this.http.get(`https://${domain}/health`, {
      headers: new HttpHeaders({
        'User-Agent': 'TamoJunto-Android-App/1.0'
      }),
      observe: 'response',
      responseType: 'text'
    }).pipe(
      timeout(15000),
      map(response => ({
        success: true,
        domain: domain,
        resolved: true,
        status: response.status,
        message: 'DNS resolution successful'
      })),
      catchError(error => of({
          success: false, 
        domain: domain,
        resolved: false,
        error: error.message,
        message: 'DNS resolution failed'
      }))
    );
  }

  /**
   * Teste de conectividade de rede geral
   */
  testNetworkConnectivity(): Observable<any> {
    const testUrls = [
      'https://www.google.com',
      'https://httpbin.org/get',
      'https://seemly-breath-production.up.railway.app/health'
    ];
    
    console.log('[Network Test] 🌍 Testing general network connectivity');
    
    const tests = testUrls.map(url => 
      this.http.get(url, {
        headers: new HttpHeaders({
          'User-Agent': 'TamoJunto-Android-App/1.0'
        }),
        observe: 'response',
        responseType: 'text'
      }).pipe(
        timeout(10000),
        map(response => ({
          url: url,
          success: true,
          status: response.status,
          responseTime: new Date().toISOString()
        })),
        catchError(error => of({
          url: url,
          success: false,
          status: error.status || 0,
          error: error.message,
          responseTime: new Date().toISOString()
        }))
      )
    );
    
    return of(tests).pipe(
      map(() => tests)
    );
  }
} 
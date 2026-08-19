import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment, API_FALLBACK_URLS } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiConnectivityService {
  private currentApiUrl = new BehaviorSubject<string>(environment.apiUrl);
  public currentApiUrl$ = this.currentApiUrl.asObservable();
  
  private isConnected = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnected.asObservable();

  constructor(private http: HttpClient) {
    this.initializeConnectivity();
  }

  /**
   * Inicializa o teste de conectividade
   */
  private async initializeConnectivity(): Promise<void> {
    console.log('[ApiConnectivity] 🔍 Iniciando teste de conectividade...');
    
    try {
      const workingUrl = await this.findWorkingApi();
      this.currentApiUrl.next(workingUrl);
      this.isConnected.next(true);
      console.log(`[ApiConnectivity] ✅ API funcionando: ${workingUrl}`);
    } catch (error) {
      console.error('[ApiConnectivity] ❌ Erro ao testar conectividade:', error);
      this.isConnected.next(false);
    }
  }

  /**
   * Encontra uma API funcionando
   */
  private async findWorkingApi(): Promise<string> {
    for (const url of API_FALLBACK_URLS) {
      try {
        console.log(`[ApiConnectivity] 🔍 Testando: ${url}`);
        
        // Teste simples de conectividade
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
        });
        
        if (response.ok) {
          console.log(`[ApiConnectivity] ✅ API funcionando: ${url}`);
          return url;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.log(`[ApiConnectivity] ❌ API não responde: ${url} - ${errorMessage}`);
      }
    }
    
    // Se nenhuma API funcionar, retorna a principal
    console.log('[ApiConnectivity] ⚠️ Nenhuma API funcionando, usando URL principal');
    return environment.apiUrl;
  }

  /**
   * Retorna a URL atual da API
   */
  getCurrentApiUrl(): string {
    return this.currentApiUrl.value;
  }

  /**
   * Força um novo teste de conectividade
   */
  async refreshConnectivity(): Promise<string> {
    console.log('[ApiConnectivity] 🔄 Forçando novo teste de conectividade...');
    
    try {
      const workingUrl = await this.findWorkingApi();
      this.currentApiUrl.next(workingUrl);
      this.isConnected.next(true);
      return workingUrl;
    } catch (error) {
      console.error('[ApiConnectivity] ❌ Erro no teste de conectividade:', error);
      this.isConnected.next(false);
      throw error;
    }
  }

  /**
   * Testa conectividade com uma URL específica
   */
  async testUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.log(`[ApiConnectivity] ❌ Falha no teste de ${url}:`, errorMessage);
      return false;
    }
  }

  /**
   * Retorna todas as URLs disponíveis
   */
  getAvailableUrls(): string[] {
    return API_FALLBACK_URLS;
  }

  /**
   * Verifica se está conectado
   */
  getConnectionStatus(): boolean {
    return this.isConnected.value;
  }

  /**
   * Retorna informações de status da conectividade
   */
  getConnectivityInfo(): { currentUrl: string; isConnected: boolean; availableUrls: string[] } {
    return {
      currentUrl: this.currentApiUrl.value,
      isConnected: this.isConnected.value,
      availableUrls: API_FALLBACK_URLS
    };
  }
} 
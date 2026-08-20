import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiConnectivityService {
  private fallbackUrls = [
    environment.apiUrl,
    'https://api.tamojunto.net'
  ];

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
    console.log('[ApiConnectivity] ðŸ” Inicializando...');
    try {
      const url = await this.findWorkingApi();
      this.currentApiUrl.next(url);
      this.isConnected.next(true);
      console.log(`[ApiConnectivity] âœ… Conectado usando: ${url}`);
    } catch (error) {
      console.error('[ApiConnectivity] âŒ Nenhuma API disponÃ­vel.');
      this.currentApiUrl.next(environment.apiUrl); // default
      this.isConnected.next(false);
    }
  }

  /**
   * Encontra uma API funcionando
   */
  private async findWorkingApi(): Promise<string> {
    for (const url of this.fallbackUrls) {
      if (await this.testUrl(url)) {
        return url;
      }
    }
    throw new Error('Nenhuma API disponÃ­vel');
  }

  /**
   * Retorna a URL atual da API
   */
  getCurrentApiUrl(): string {
    return this.currentApiUrl.value;
  }

  /**
   * ForÃ§a um novo teste de conectividade
   */
  async refreshConnectivity(): Promise<string> {
    await this.initializeConnectivity();
    return this.currentApiUrl.value;
  }

  /**
   * Testa conectividade com uma URL especÃ­fica
   */
  async testUrl(url: string): Promise<boolean> {
    try {
      // Faz um fetch rÃ¡pido para ver se responde (qualquer status vÃ¡lido serve, atÃ© 404, desde que nÃ£o seja CORS/erro de rede)
      const response = await fetch(`${url}/Usuario/ping`, { method: 'GET', mode: 'cors' });
      return true; // Se respondeu algo, a rede estÃ¡ viva
    } catch (e) {
      return false; // Erro de rede (CORS ou 502/504)
    }
  }

  /**
   * Retorna todas as URLs disponÃ­veis
   */
  getAvailableUrls(): string[] {
    return this.fallbackUrls;
  }

  /**
   * Verifica se estÃ¡ conectado
   */
  getConnectionStatus(): boolean {
    return this.isConnected.value;
  }

  /**
   * Retorna informaÃ§Ãµes de status da conectividade
   */
  getConnectivityInfo(): { currentUrl: string; isConnected: boolean; availableUrls: string[] } {
    return {
      currentUrl: this.currentApiUrl.value,
      isConnected: this.isConnected.value,
      availableUrls: this.fallbackUrls
    };
  }
} 

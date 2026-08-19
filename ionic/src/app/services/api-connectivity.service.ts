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
    'https://app.tamojunto.net/api'
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
    console.log('[ApiConnectivity] 🔍 Inicializando...');
    try {
      const url = await this.findWorkingApi();
      this.currentApiUrl.next(url);
      this.isConnected.next(true);
      console.log(`[ApiConnectivity] ✅ Conectado usando: ${url}`);
    } catch (error) {
      console.error('[ApiConnectivity] ❌ Nenhuma API disponível.');
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
    throw new Error('Nenhuma API disponível');
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
    await this.initializeConnectivity();
    return this.currentApiUrl.value;
  }

  /**
   * Testa conectividade com uma URL específica
   */
  async testUrl(url: string): Promise<boolean> {
    try {
      // Faz um fetch rápido para ver se responde (qualquer status válido serve, até 404, desde que não seja CORS/erro de rede)
      const response = await fetch(`${url}/Usuario/ping`, { method: 'GET', mode: 'cors' });
      return true; // Se respondeu algo, a rede está viva
    } catch (e) {
      return false; // Erro de rede (CORS ou 502/504)
    }
  }

  /**
   * Retorna todas as URLs disponíveis
   */
  getAvailableUrls(): string[] {
    return this.fallbackUrls;
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
      availableUrls: this.fallbackUrls
    };
  }
} 
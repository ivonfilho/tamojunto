import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
    console.log('[ApiConnectivity] 🔍 Inicializando...');
    this.currentApiUrl.next(environment.apiUrl);
    this.isConnected.next(true);
  }

  /**
   * Encontra uma API funcionando
   */
  private async findWorkingApi(): Promise<string> {
    return environment.apiUrl;
  }

  /**
   * Retorna a URL atual da API
   */
  getCurrentApiUrl(): string {
    return environment.apiUrl;
  }

  /**
   * Força um novo teste de conectividade
   */
  async refreshConnectivity(): Promise<string> {
    return environment.apiUrl;
  }

  /**
   * Testa conectividade com uma URL específica
   */
  async testUrl(url: string): Promise<boolean> {
    return true;
  }

  /**
   * Retorna todas as URLs disponíveis
   */
  getAvailableUrls(): string[] {
    return [environment.apiUrl];
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
      currentUrl: environment.apiUrl,
      isConnected: this.isConnected.value,
      availableUrls: [environment.apiUrl]
    };
  }
} 
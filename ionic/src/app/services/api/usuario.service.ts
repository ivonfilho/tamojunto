import { Injectable } from '@angular/core';
import { ApiConfig } from './api.config';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { ApiConnectivityService } from '../api-connectivity.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService extends ApiConfig {
  private usuarioLogadoSubject: BehaviorSubject<any>;
  public usuarioLogado$: Observable<any>;
  
  constructor(
    private http: HttpClient,
    private apiConnectivity: ApiConnectivityService
  ) {
    super();
    const usuarioLogadoStorage = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
    this.usuarioLogadoSubject = new BehaviorSubject<any>(usuarioLogadoStorage);
    this.usuarioLogado$ = this.usuarioLogadoSubject.asObservable();
  }

  /**
   * Retorna a URL da API atual (com fallback)
   */
  private getApiUrl(): string {
    return this.apiConnectivity.getCurrentApiUrl();
  }

  login(usuario: any) {
    return new Promise(async (resolve, reject) => {
      console.log('Tentando login com:', usuario);
      const apiUrl = this.getApiUrl();
      console.log('URL da API:', `${apiUrl}/api/usuario/Entrar`);
      
      this.http
        .post(`${apiUrl}/api/usuario/Entrar`, usuario)
    .subscribe(
      (data: any) => {
        console.log('Resposta do servidor:', data);
        if (data && data.token) {

          const decodedToken: any = jwtDecode(data.token);
          const userId = decodedToken?.Id;

          if (userId) {

            data.Id = userId;
            // Usar a mesma chave que o AuthService
            localStorage.setItem('tamo_junto_user', JSON.stringify(data));
            // Manter compatibilidade com a chave antiga
            localStorage.setItem('usuarioLogado', JSON.stringify(data));
            this.usuarioLogadoSubject.next(data);
          } else {
            console.error(' ID do usuário não encontrado no token:', decodedToken);
          }
        } else {
          console.error(' Token não encontrado na resposta do backend:', data);
        }
        resolve(data);
      },
      (error) => {
        console.error(' Erro no login:', error);
        console.error(' Status:', error.status);
        console.error(' Mensagem:', error.message);
        console.error(' URL:', error.url);
        
        // Tentar fallback de API se houver erro de conectividade
        if (error.status === 0 || error.status === 404) {
          this.handleApiFallback(reject);
        } else {
          reject(error);
        }
      }
    );
});
  }

  cadastro(usuario: any) {
    return new Promise(async (resolve, reject) => {
      const apiUrl = this.getApiUrl();
      console.log('Tentando cadastro com API:', apiUrl);
      
      this.http
        .post(`${apiUrl}/api/usuario/cadastrar`, usuario)
        .subscribe(
          (data) => {
            resolve(data);
          },
          (error) => {
            console.error('Erro no cadastro:', error);
            
            // Tentar fallback de API se houver erro de conectividade
            if (error.status === 0 || error.status === 404) {
              this.handleApiFallback(reject);
            } else {
              reject(error);
            }
          }
        );
    });
  }

  reenviarConfirmacaoEmail(body: { email: string }) {
    return new Promise((resolve, reject) => {
      const apiUrl = this.getApiUrl();
      this.http
        .post(`${apiUrl}/api/usuario/reenviar-confirmacao-email`, body)
        .subscribe({
          next: (data) => resolve(data),
          error: (error) => {
            if (error.status === 0 || error.status === 404) {
              this.handleApiFallback(reject);
            } else {
              reject(error);
            }
          },
        });
    });
  }

  /**
   * Trata fallback de API quando há erro de conectividade
   */
  private async handleApiFallback(reject: (reason?: any) => void): Promise<void> {
    try {
      
      // Forçar novo teste de conectividade
      const newApiUrl = await this.apiConnectivity.refreshConnectivity();
      
      if (newApiUrl !== this.getApiUrl()) {
        // Retornar erro para que o usuário tente novamente
        reject(new Error(`API alterada para: ${newApiUrl}. Tente novamente.`));
      } else {
        reject(new Error('Sem conexão com a internet. Verifique sua rede.'));
      }
    } catch (fallbackError) {
      reject(new Error('Sem conexão com a internet. Verifique sua rede.'));
    }
  }

  alterar(usuario:any){
    return new Promise(async (resolve, reject) => {
      const apiUrl = this.getApiUrl();
      const fullUrl = `${apiUrl}/api/usuario/alterar`;

      
      this.http
        .put(fullUrl, usuario)
        .subscribe(
          (data) => {
            resolve(data);
          },
          (error) => {
            console.error('Erro na alteração:', error);
            console.error('Status:', error.status);
            console.error('Mensagem:', error.message);
            console.error('URL chamada:', error.url || fullUrl);
            console.error('Erro completo:', JSON.stringify(error, null, 2));
            
            // Tentar fallback de API se houver erro de conectividade
            if (error.status === 0 || error.status === 404) {
              this.handleApiFallback(reject);
            } else {
              reject(error);
            }
          }
        );
    });
  }

  getUsuario(){
    return new Promise(async (resolve, reject) => {
      const apiUrl = this.getApiUrl();
      console.log('Tentando buscar usuário com API:', apiUrl);
      
      this.http
        .get(`${apiUrl}/api/usuario/Perfil`)
        .subscribe(
          (data) => {
            resolve(data);
          },
          (error) => {
            console.error('Erro ao buscar usuário:', error);
            
            // Tentar fallback de API se houver erro de conectividade
            if (error.status === 0 || error.status === 404) {
              this.handleApiFallback(reject);
            } else {
              reject(error);
            }
          }
        );
    });
  }


  setUsuarioLogado(usuario: any): void {
    this.usuarioLogadoSubject.next(usuario);
    // Salvar em ambas as chaves para manter compatibilidade
    localStorage.setItem('tamo_junto_user', JSON.stringify(usuario));
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
  }

  getUsuarioLogado(): any {
    // Primeiro tentar a chave principal usada pelo AuthService
    let usuarioLogado = localStorage.getItem('tamo_junto_user');
    
    if (usuarioLogado) {
      const parsedUsuario = JSON.parse(usuarioLogado);
      if (parsedUsuario.Id) {
        return parsedUsuario;
      } else {
        console.error('ID do usuário não encontrado em tamo_junto_user:', parsedUsuario);
      }
    }
    
    // Fallback para a chave antiga
    usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
      const parsedUsuario = JSON.parse(usuarioLogado);
      if (parsedUsuario.Id) {
        return parsedUsuario;
      } else {
        console.error('ID do usuário não encontrado em usuarioLogado:', parsedUsuario);
      }
    }
        return null;
  }


  isAutenticado(): boolean {
    return !!this.getUsuarioLogado();
  }


  logout(): void {
    this.usuarioLogadoSubject.next(null);
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('tamo_junto_user');
    console.log('Usuário deslogado.');
  }
  /**
   * Recuperar senha por email
   */
  recuperarSenhaEmail(data: any): Observable<any> {
    const apiUrl = this.getApiUrl();
    console.log('Enviando solicitação de recuperação por email:', data);
    console.log('URL da API:', `${apiUrl}/api/usuario/recuperar-senha-email`);
    
    return this.http.post(`${apiUrl}/api/usuario/recuperar-senha-email`, data);
  }
}

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError} from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Adiciona headers básicos para Android
    request = this.addBasicHeaders(request);
    
    // Adiciona token de autenticação se disponível
    const token = this.authService.getToken();
    if (token) {
      request = this.addToken(request, token);
    } else {
      console.warn('[HTTP Interceptor] Token não encontrado!');
    }

    if (request.headers.has('Authorization')) {
    } else {
      console.warn('[HTTP Interceptor]  Header Authorization ausente!');
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        
        
        // Trata erros de autenticação primeiro (401)
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        
        // Trata erros específicos de conectividade (status 0 ou sem status)
        // Mas NÃO trata erros HTTP válidos (400, 404, 500, etc.) como conectividade
        if (this.isConnectivityError(error)) {
          return this.handleConnectivityError(error);
        }
        
        // Trata outros erros (400, 404, 500, etc.)
        return this.handleOtherErrors(error);
      })
    );
  }

  /**
   * Adiciona headers básicos para melhorar conectividade
   */
  private addBasicHeaders(request: HttpRequest<any>): HttpRequest<any> {
    const headers: { [key: string]: string } = {
      'Accept': 'application/json, text/plain, */*',
      'Cache-Control': 'no-cache',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Adiciona headers específicos para Android
    if (this.isAndroid()) {
      headers['X-Platform'] = 'Android';
      headers['X-Capacitor'] = 'true';
    }

    return request.clone({
      setHeaders: headers
    });
  }

  /**
   * Verifica se está rodando no Android
   */
  private isAndroid(): boolean {
    return navigator.userAgent.includes('Android') || 
           navigator.platform.includes('Android') ||
           /Android/i.test(navigator.userAgent);
  }

  /**
   * Adiciona token de autenticação
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Verifica se é um erro de conectividade
   * IMPORTANTE: Erros HTTP válidos (400, 401, 404, 500, etc.) NÃO são erros de conectividade
   */
  private isConnectivityError(error: HttpErrorResponse): boolean {
    // Status 0 indica erro de CORS ou rede (sem resposta do servidor)
    if (error.status === 0) {
      return true;
    }
    
    // Se tem status HTTP válido (não é 0), não é erro de conectividade
    // Erros HTTP válidos são tratados em handleOtherErrors
    if (error.status && error.status > 0) {
      return false;
    }
    
    // Erros de rede (sem status HTTP válido)
    return error.message.includes('Network Error') ||
           (error.message.includes('Http failure response') && !error.status) ||
           error.message.includes('net::ERR_FAILED') ||
           error.message.includes('net::ERR_CONNECTION_REFUSED') ||
           error.message.includes('net::ERR_TIMED_OUT') ||
           error.message.includes('CORS') ||
           error.message.includes('cors');
  }

  /**
   * Trata erros de conectividade
   */
  private handleConnectivityError(error: HttpErrorResponse): Observable<HttpEvent<any>> {
    console.log('[HTTP Interceptor] 🌐 Handling connectivity error:', error);
    
    let errorMessage = 'Erro de conectividade';
    
    if (error.status === 0) {
      errorMessage = 'Erro de rede - Verifique a conexão com a internet';
    } else if (error.message.includes('Network Error')) {
      errorMessage = 'Erro de rede. Verifique sua conexão.';
    } else if (error.message.includes('net::ERR_FAILED')) {
      errorMessage = 'Falha na conexão. Verifique sua internet.';
    } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      errorMessage = 'Conexão recusada pelo servidor.';
    } else if (error.message.includes('net::ERR_TIMED_OUT')) {
      errorMessage = 'Timeout de conexão. Verifique sua internet.';
    } else {
      errorMessage = 'Problema de conectividade. Verifique sua rede.';
    }
        
    // Retorna erro com mensagem amigável (preserva HttpErrorResponse para status/url no subscribe)
    return throwError(() => {
      const err = new Error(errorMessage);
      (err as any).originalError = error;
      (err as any).status = error.status;
      (err as any).url = error.url;
      return err;
    });
  }

  /**
   * Trata erros 401 (não autorizado)
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {    
    // Retorna o erro original para que o componente possa tratá-lo adequadamente
    return throwError(() => new Error('Usuário ou senha incorretos'));
  }

  /**
   * Trata outros tipos de erro
   */
  private handleOtherErrors(error: HttpErrorResponse): Observable<HttpEvent<any>> {    
    let errorMessage = 'Erro desconhecido';
    
    // Primeiro, tentar extrair mensagem do backend
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      }
    }
    
    // Se não encontrou mensagem do backend, usar mensagens padrão baseadas no status
    if (errorMessage === 'Erro desconhecido' || !errorMessage) {
      // Tratar erros de servidor (500+)
      if (error.status >= 500) {
        if (error.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        } else if (error.status === 502) {
          errorMessage = 'Servidor temporariamente indisponível. Tente novamente.';
        } else if (error.status === 503) {
          errorMessage = 'Serviço em manutenção. Tente novamente em alguns minutos.';
        } else if (error.status === 504) {
          errorMessage = 'Timeout de conexão. Tente novamente.';
        } else {
          errorMessage = 'Erro no servidor. Tente novamente em alguns minutos.';
        }
      }
      // Tratar erros de cliente (400+)
      else if (error.status >= 400) {
        if (error.status === 400) {
          errorMessage = 'Dados inválidos. Verifique as informações enviadas.';
        } else if (error.status === 401) {
          errorMessage = 'Não autorizado. Faça login novamente.';
        } else if (error.status === 403) {
          errorMessage = 'Acesso negado.';
        } else if (error.status === 404) {
          errorMessage = 'Recurso não encontrado.';
        } else if (error.status === 422) {
          errorMessage = 'Dados inválidos. Verifique as informações.';
        } else {
          errorMessage = 'Erro na requisição. Verifique os dados enviados.';
        }
      }
    }    
    // Retornar erro com a mensagem extraída ou padrão
    return throwError(() => {
      const err = new Error(errorMessage);
      // Adicionar informações adicionais ao erro para debug
      (err as any).originalError = error;
      (err as any).status = error.status;
      (err as any).url = error.url;
      return err;
    });
  }
}

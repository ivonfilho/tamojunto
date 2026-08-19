import { Injectable } from '@angular/core';
import { ApiConfig } from './api/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FotoPerfilService extends ApiConfig {

  constructor(private http: HttpClient) {
    super();
  }


  getFotoPerfil(usuarioId: string): Observable<any> {
    return this.http.get<any>(`${this.URL_API}/api/fotoPerfil/RecuperarImagemPerfil?usuarioId=${usuarioId}`).pipe(
      catchError((error) => {
        console.error('Erro ao obter imagem de perfil do usuário:', error);
        throw error;
      })
    );
  }

  uploadFotoPerfil(id: string, arquivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('file', arquivo);

    return this.http.post<any>(`${this.URL_API}/api/fotoPerfil/${id}/UploadImagem`, formData).pipe(
      tap(() => console.log('Upload de foto de perfil realizado com sucesso')),
      catchError((error) => {
        console.error('Erro ao enviar foto de perfil:', error);
        throw error;
      })
    );
  }

  deleteFotoPerfil(usuarioId: string): Observable<any> {
    return this.http.delete<any>(`${this.URL_API}/api/fotoPerfil/Deletar?usuarioId=${usuarioId}`).pipe(
      catchError((error) => {
        console.error('Erro ao excluir imagem do usuário:', error);
        throw error;
      })
    );
  }

}

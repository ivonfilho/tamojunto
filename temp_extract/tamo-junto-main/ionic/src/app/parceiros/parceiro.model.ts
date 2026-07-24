export interface Empresa {
  id?: string;
  nome: string;
  cnpj: string;
}

export interface Parceiro {
  id?: string;
  nome: string;
  website: string;
  contato: string;
  status: boolean;
  dataCriacao: string;
  idUsuario: string; 
  idEmpresa: string;
  idEmpresaNavigation?: Empresa; 
}

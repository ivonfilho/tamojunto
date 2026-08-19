export interface UsuarioResponse {
  usuario: {
    nome: string;
    email: string;
    imagemUrl?: string | null;
    token?: string | null;
  };
  cpf?: string;
  tipoCadastro: 'PF' | 'MEI' | 'PJ';
  role?: string;
  assinaturas?: any[];
  empresa?: {
    nome: string;
    cnpj: string;
    atividade: string;
    contato?: string;
  };
  parceiro?: {
    id?: string;
    nome?: string;
    website?: string;
    contato?: string;
  };
}

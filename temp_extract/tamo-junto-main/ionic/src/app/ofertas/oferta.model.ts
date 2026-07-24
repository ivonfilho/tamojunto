
export interface Oferta {
    id?: string;
    idParceiro: string;
    dataCriacao: string;
    validade: string;
    descricao: string;
    categoria: string;
    idEndereco: string;
    nomeProduto: string;
    preco: number;
    desconto: number;
    tipoProduto: string;
    tipoOferta:string;
    idUsuarioCadastrante: string;
    imagemPaths?: string[];
    imagem?: any[]; 
    [key: string]: any;
  }


  export interface Endereco {
    id?: string;
    nome?: string;
    pais?: string;
    rua: string;
    complemento?: string;
    estado: string;
    cidade: string;
    bairro: string;
    idUsuario: string;
    [key: string]: any;
  }

  export interface resgatarOferta {
    IdOfertaParceiro: string,
    IdCliente: string
  }

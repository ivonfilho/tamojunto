const JWT_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

/** Role comercial (Parceiro PJ) — não confundir com MEI (cliente com empresa). */
export function obterRoleUsuario(origem: any): string {
  if (!origem) {
    return 'Cliente';
  }
  const role =
    origem.role ??
    origem.Role ??
    origem[JWT_ROLE_CLAIM];
  return typeof role === 'string' && role.trim() ? role : 'Cliente';
}

export function obterIdUsuario(origem: any): string | null {
  if (!origem) {
    return null;
  }
  const id = origem.Id ?? origem.id;
  return id != null && String(id).trim() ? String(id) : null;
}

export function isUsuarioParceiroComercial(origem: any): boolean {
  return obterRoleUsuario(origem) === 'Parceiro';
}

/** Tipo exibido no perfil: PJ só para role Parceiro; MEI/PF vêm do cadastro de cliente. */
export function resolverTipoCadastroPerfil(perfilApi: any, role: string): 'PF' | 'MEI' | 'PJ' {
  if (role === 'Parceiro') {
    return 'PJ';
  }
  const tipo = perfilApi?.tipoCadastro ?? perfilApi?.TipoCadastro;
  if (tipo === 'MEI' || tipo === 'PJ' || tipo === 'PF') {
    return tipo === 'PJ' && role !== 'Parceiro' ? 'MEI' : tipo;
  }
  return perfilApi?.empresa || perfilApi?.Empresa ? 'MEI' : 'PF';
}

/** Mantém Id/role/nome do login ao mesclar resposta de /Perfil (evita sessão corrompida). */
export function mesclarUsuarioSessao(base: any, perfil?: any): any {
  const role = obterRoleUsuario(base) || obterRoleUsuario(perfil);
  const id = obterIdUsuario(base) || obterIdUsuario(perfil);
  const nome =
    base?.nome ??
    base?.Nome ??
    perfil?.usuario?.nome ??
    perfil?.Usuario?.nome ??
    perfil?.Usuario?.Nome;
  const email =
    base?.email ??
    base?.Email ??
    perfil?.usuario?.email ??
    perfil?.Usuario?.email ??
    perfil?.Usuario?.Email;
  const token = base?.token ?? base?.Token ?? perfil?.token;
  const imagemUrl =
    base?.imagemUrl ??
    base?.ImagemUrl ??
    perfil?.usuario?.imagemUrl ??
    perfil?.Usuario?.imagemUrl;

  return {
    ...(base && typeof base === 'object' ? base : {}),
    Id: id,
    id,
    role,
    Role: role,
    nome,
    Nome: nome,
    email,
    Email: email,
    token,
    imagemUrl,
    tipoCadastro: perfil ? resolverTipoCadastroPerfil(perfil, role) : base?.tipoCadastro,
  };
}

export function roleFromJwtPayload(decoded: any): string {
  if (!decoded) {
    return 'Cliente';
  }
  return obterRoleUsuario(decoded);
}

const fs = require('fs');
const files = ['src/app/cadastro-form/cadastro-form.component.html', 'src/app/header/profile-modal/profile-modal.component.html'];
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/label="" label-placement="floating"(\s*)formControlName="nomeEmpresa"/g, 'label="Nome Fantasia" label-placement="floating"$1formControlName="nomeEmpresa"');
  c = c.replace(/label="" label-placement="floating"(\s*)formControlName="contato"/g, 'label="Contato" label-placement="floating"$1formControlName="contato"');
  c = c.replace(/label="" label-placement="floating"(\s*)formControlName="cnpj"/g, 'label="CNPJ" label-placement="floating"$1formControlName="cnpj"');
  c = c.replace(/label="" label-placement="floating"(\s*)formControlName="atividade"/g, 'label="Atividade principal" label-placement="floating"$1formControlName="atividade"');
  c = c.replace(/label="" label-placement="floating"(\s*)formControlName="website"/g, 'label="Website (opcional)" label-placement="floating"$1formControlName="website"');
  c = c.replace(/label="" label-placement="floating"(\s*)formControlName="nome"/g, 'label="Nome" label-placement="floating"$1formControlName="nome"');
  c = c.replace(/label="" label-placement="floating"(\s*)formControlName="email"/g, 'label="E-mail" label-placement="floating"$1formControlName="email"');
  c = c.replace(/label="" label-placement="floating"(\s*)formControlName="senha"/g, 'label="Senha" label-placement="floating"$1formControlName="senha"');
  c = c.replace(/label="" label-placement="floating"(\s*)formControlName="confirmacaoSenha"/g, 'label="Confirmar senha" label-placement="floating"$1formControlName="confirmacaoSenha"');
  fs.writeFileSync(f, c);
});

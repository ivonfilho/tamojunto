using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.EntityFrameworkCore;

namespace TamoJunto.Domain.Models;

public partial class TamoJuntoContext : DbContext
{
    public TamoJuntoContext()
    {
    }

    public TamoJuntoContext(DbContextOptions<TamoJuntoContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Assinatura> Assinatura { get; set; }

    public virtual DbSet<Backoffice> Backoffice { get; set; }

    public virtual DbSet<Cliente> Cliente { get; set; }

    public virtual DbSet<CupomCliente> CupomCliente { get; set; }

    public virtual DbSet<Empresa> Empresa { get; set; }

    public virtual DbSet<Endereco> Endereco { get; set; }

    public virtual DbSet<HistoricoLogin> HistoricoLogin { get; set; }

    public virtual DbSet<Imagem> Imagem { get; set; }

    public virtual DbSet<OfertaParceiro> OfertaParceiro { get; set; }

    public virtual DbSet<Pagamento> Pagamento { get; set; }

    public virtual DbSet<Parceiro> Parceiro { get; set; }

    public virtual DbSet<Usuario> Usuario { get; set; }

    public virtual DbSet<Notificacao> Notificacao { get; set; }

    public virtual DbSet<HistoricoCupom> HistoricoCupons { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Assinatura>(entity =>
        {
            entity.ToTable("Assinatura");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.IdPagamento)
                .HasColumnName("IdPagamento");
            entity.Property(e => e.IdCliente)
                .HasColumnName("IdCliente");
            entity.Property(e => e.IdPlano)
                .HasColumnName("idPlano");
            entity.Property(e => e.IdParceiro)
                .HasColumnName("IdParceiro");
            entity.Property(e => e.DataCompra)
                .HasColumnName("DataCompra")
                .HasColumnType("TIMESTAMP");
            entity.Property(e => e.DataRenovacao)
                .HasColumnName("DataRenovacao")
                .HasColumnType("TIMESTAMP");

            entity.HasOne(d => d.IdClienteNavigation).WithMany(p => p.Assinatura)
                .HasForeignKey(d => d.IdCliente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Assinatura_Cliente");

            entity.HasOne(d => d.IdPagamentoNavigation).WithOne(p => p.Assinatura)
                .HasForeignKey<Assinatura>(d => d.IdPagamento)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Assinatura_Pagamento");

            entity.HasOne(d => d.IdPlanoNavigation).WithMany()
                .HasForeignKey(d => d.IdPlano)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Assinatura_Plano");
        });

        modelBuilder.Entity<Backoffice>(entity =>
        {
            entity.ToTable("Backoffice");
            entity.HasIndex(e => e.Id, "IdParceiro_Backoffice_Unique");

            entity.HasIndex(e => e.IdUsuario, "IdUsuario_Backoffice_Unique").IsUnique();

            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.Cpf)
                .HasColumnName("Cpf")
                .HasMaxLength(12)
                .IsUnicode(false);
            entity.Property(e => e.IdUsuario)
                .HasColumnName("IdUsuario");

            entity.HasOne(d => d.IdUsuarioNavigation).WithOne(p => p.Backoffice)
                .HasForeignKey<Backoffice>(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Backoffice_Usuario");
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("Cliente");
            entity.HasIndex(e => e.IdEmpresa, "IdEmpresa_Cliente_Unique").IsUnique();

            entity.HasIndex(e => e.IdUsuario, "IdUsuario_Cliente_Unique").IsUnique();

            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.Cpf)
                .HasColumnName("Cpf")
                .HasMaxLength(11)
                .IsUnicode(false);
            entity.Property(e => e.IdUsuario)
                .HasColumnName("IdUsuario");
            entity.Property(e => e.IdEmpresa)
                .HasColumnName("IdEmpresa");

            entity.HasOne(d => d.IdEmpresaNavigation).WithOne(p => p.Cliente)
                .HasForeignKey<Cliente>(d => d.IdEmpresa)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Cliente_Empresa");

            entity.HasOne(d => d.IdUsuarioNavigation).WithOne(p => p.Cliente)
                .HasForeignKey<Cliente>(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Cliente_Usuario");
        });

        modelBuilder.Entity<CupomCliente>(entity =>
        {
            entity.ToTable("CupomCliente");
            entity.HasIndex(e => e.IdOfertaParceiro, "IdOfertaParceiro_CupomCliente_unique").IsUnique();

            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.DataResgate)
                .HasColumnName("DataResgate")
                .HasColumnType("TIMESTAMP");
            entity.Property(e => e.DataUtilizacao)
                .HasColumnName("DataUtilizacao")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.IdOfertaParceiro)
                .HasColumnName("IdOfertaParceiro");
            entity.Property(e => e.IdCliente)
                .HasColumnName("IdCliente");

            entity.HasOne(d => d.IdClienteNavigation).WithMany(p => p.CupomCliente)
                .HasForeignKey(d => d.IdCliente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CupomCliente_Cliente");
        });

        modelBuilder.Entity<Empresa>(entity =>
        {
            entity.ToTable("Empresa");
            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.Atividade)
                .HasColumnName("Atividade")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Cnpj)
                .HasColumnName("Cnpj")
                .HasMaxLength(15)
                .IsUnicode(false);
            entity.Property(e => e.Nome)
                .HasColumnName("Nome")
                .HasMaxLength(255)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Endereco>(entity =>
        {
            entity.ToTable("Endereco");
            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.Bairro)
                .HasColumnName("Bairro")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Cidade)
                .HasColumnName("Cidade")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Complemento)
                .HasColumnName("Complemento")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Estado)
                .HasColumnName("Estado")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Nome)
                .HasColumnName("Nome")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Pais)
                .HasColumnName("Pais")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Rua)
                .HasColumnName("Rua")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Numero)
                .HasColumnName("Numero");
            entity.Property(e => e.IdUsuario)
                .HasColumnName("IdUsuario");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.Endereco)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Endereco_Usuario");
        });

        modelBuilder.Entity<HistoricoLogin>(entity =>
        {
            entity.ToTable("HistoricoLogin");
            entity.HasNoKey();

            entity.Property(e => e.Date)
                .HasColumnName("Date")
                .HasColumnType("TIMESTAMP");
            entity.Property(e => e.Ip)
                .HasColumnName("Ip")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Local)
                .HasColumnName("Local")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.IdUsuario)
                .HasColumnName("IdUsuario");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany()
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HistoricoLogin_Usuario");
        });

        modelBuilder.Entity<Imagem>(entity =>
        {
            entity.ToTable("Imagem");
            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.Path)
                .HasColumnName("Path");
            entity.Property(e => e.IdOfertaParceiro)
                .HasColumnName("IdOfertaParceiro");
            entity.Property(e => e.UsuarioId)
                .HasColumnName("UsuarioId");

            entity.HasOne(d => d.IdOfertaParceiroNavigation).WithMany(p => p.Imagem)
                .HasForeignKey(d => d.IdOfertaParceiro)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Imagem_OfertaParceiro");

            entity.HasOne(d => d.UsuarioNavigation).WithMany()
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Imagem_Usuario");
        });

        modelBuilder.Entity<OfertaParceiro>(entity =>
        {
            entity.ToTable("OfertaParceiro");
            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.Categoria)
                .HasColumnName("Categoria")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.DataCriacao)
                .HasColumnName("DataCriacao")
                .HasColumnType("TIMESTAMP");
            entity.Property(e => e.Desconto)
                .HasColumnName("Desconto")
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Descricao)
                .HasColumnName("Descricao")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.NomeProduto)
                .HasColumnName("NomeProduto")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Preco)
                .HasColumnName("Preco")
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TipoOferta)
                .HasColumnName("TipoOferta")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.TipoProduto)
                .HasColumnName("TipoProduto")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Validade)
                .HasColumnName("Validade")
                .HasColumnType("TIMESTAMP");
            entity.Property(e => e.IdEndereco)
                .HasColumnName("IdEndereco");
            entity.Property(e => e.IdParceiro)
                .HasColumnName("IdParceiro");
            entity.Property(e => e.CategoriaCupom)
                .HasColumnName("CategoriaCupom")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.IdUsuarioCadastrante)
                .HasColumnName("IdUsuarioCadastrante");
                            entity.Property(e => e.Status)
                    .HasColumnName("Status");
                entity.Property(e => e.QrCodePath)
                    .HasColumnName("QrCodePath")
                    .HasMaxLength(255)
                    .IsUnicode(false);

            entity.HasOne(d => d.IdNavigation).WithOne(p => p.OfertaParceiro)
                .HasForeignKey<CupomCliente>(d => d.IdOfertaParceiro)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CupomCliente_OfertaParceiro");

            entity.HasOne(d => d.IdEnderecoNavigation).WithMany(p => p.OfertaParceiro)
                .HasForeignKey(d => d.IdEndereco)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OfertaParceiro_Endereco");

            entity.HasOne(d => d.IdParceiroNavigation).WithMany(p => p.OfertaParceiro)
                .HasForeignKey(d => d.IdParceiro)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OfertaParceiro_Parceiro");
        });

        modelBuilder.Entity<Pagamento>(entity =>
        {
            entity.ToTable("Pagamento");
            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.Data)
                .HasColumnName("Data")
                .HasColumnType("TIMESTAMP");
            entity.Property(e => e.Descricao)
                .HasColumnName("Descricao")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Status)
                .HasColumnName("Status")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Valor)
                .HasColumnName("Valor")
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UrlPagamento)
                .HasColumnName("UrlPagamento")
                .HasColumnType("text");
        });

        modelBuilder.Entity<Plano>(entity =>
        {
            entity.ToTable("Plano");
            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.Titulo)
                .HasColumnName("Titulo")
                .HasColumnType("text");
            entity.Property(e => e.Valor)
                .HasColumnName("Valor")
                .HasColumnType("numeric");
            entity.Property(e => e.Descricao)
                .HasColumnName("Descricao")
                .HasColumnType("text");
            entity.Property(e => e.Tipo)
                .HasColumnName("Tipo")
                .HasColumnType("text");
            entity.Property(e => e.Ativo)
                .HasColumnName("Ativo")
                .HasColumnType("boolean");
            entity.Property(e => e.DataCriacao)
                .HasColumnName("DataCriacao")
                .HasColumnType("timestamp without time zone");
        });

        modelBuilder.Entity<Parceiro>(entity =>
        {
            entity.ToTable("Parceiros");
            entity.HasIndex(e => e.IdEmpresa, "IdEmpresa_Parceiro_Unique").IsUnique();

            entity.HasIndex(e => e.IdUsuario, "IdUsuario_Parceiro_Unique").IsUnique();

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();
            entity.Property(e => e.IdUsuario)
                .HasColumnName("idUsuario");
            entity.Property(e => e.IdEmpresa)
                .HasColumnName("idEmpresa");
            entity.Property(e => e.Nome)
                .HasColumnName("nome")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Website)
                .HasColumnName("website")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.DataCriacao)
                .HasColumnName("dataCriacao")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Contato)
                .HasColumnName("contato")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Status)
                .HasColumnName("status");

            entity.HasOne(d => d.IdEmpresaNavigation).WithOne(p => p.Parceiro)
                .HasForeignKey<Parceiro>(d => d.IdEmpresa)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Parceiro_Empresa");

            entity.HasOne(d => d.IdUsuarioNavigation).WithOne(p => p.Parceiro)
                .HasForeignKey<Parceiro>(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Parceiro_Usuario");
        });

        modelBuilder.Entity<Notificacao>(entity =>
        {
            entity.ToTable("Notificacao");
            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.Titulo)
                .HasColumnName("Titulo")
                .HasColumnType("text");
            entity.Property(e => e.SubTitulo)
                .HasColumnName("SubTitulo")
                .HasColumnType("text");
            entity.Property(e => e.DataCriacao)
                .HasColumnName("DataCriacao")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.IdUsuario)
                .HasColumnName("IdUsuario")
                .HasColumnType("uuid");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuario");
            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.DataCadastro)
                .HasColumnName("DataCadastro")
                .HasColumnType("TIMESTAMP");
            entity.Property(e => e.Email)
                .HasColumnName("Email")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Nome)
                .HasColumnName("Nome")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Senha)
                .HasColumnName("Senha")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.UrlImagem)
                .HasColumnName("UrlImagem")
                .HasColumnType("text");
            entity.Property(e => e.Role)
                .HasColumnName("Role")
                .HasConversion<int>();
            // Produção Railway: colunas costumam estar em PascalCase (ex.: "EmailConfirmed").
            // Se o banco tiver só as colunas da migration em camelCase (emailConfirmed), renomeie no Postgres
            // ou alinhe com um snapshot único — misturar nomes quebra SELECT/UPDATE.
            entity.Property(e => e.ResetPasswordToken)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.ResetPasswordTokenExpiry)
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.EmailConfirmed)
                .HasColumnType("boolean");
            entity.Property(e => e.EmailConfirmationToken)
                .HasMaxLength(255)
                .IsUnicode(false);
        });

        modelBuilder.Entity<HistoricoCupom>(entity =>
        {
            entity.ToTable("HistoricoCupom");
            entity.Property(e => e.Id)
                .HasColumnName("Id")
                .ValueGeneratedNever();
            entity.Property(e => e.DataUso)
                .HasColumnName("DataUso")
                .HasColumnType("TIMESTAMP");
            entity.Property(e => e.Status)
                .HasColumnName("Status")
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.IdCupom)
                .HasColumnName("IdCupom");
            entity.Property(e => e.IdUsuario)
                .HasColumnName("IdUsuario");
        });



        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        //var dbServer = "localhost";
        //optionsBuilder.UseMySQL(
        //var connectionString = "";
        //mySqlOptions => mySqlOptions.CommandTimeout(60));
        //optionsBuilder.UseCamelCaseNamingConvention();
    }
}

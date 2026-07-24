using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TamoJunto.Domain.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Empresa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Cnpj = table.Column<string>(type: "character varying(15)", unicode: false, maxLength: 15, nullable: false),
                    Nome = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Atividade = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Empresa", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notificacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Titulo = table.Column<string>(type: "text", nullable: false),
                    SubTitulo = table.Column<string>(type: "text", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IdUsuario = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Notificacao", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pagamento",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Data = table.Column<DateTime>(type: "TIMESTAMP", nullable: false),
                    Descricao = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    UrlPagamento = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Pagamento", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Plano",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Titulo = table.Column<string>(type: "text", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric", nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Plano", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Senha = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "TIMESTAMP", nullable: false),
                    UrlImagem = table.Column<string>(type: "text", nullable: true),
                    Role = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Usuario", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Backoffice",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IdUsuario = table.Column<Guid>(type: "uuid", nullable: false),
                    Cpf = table.Column<string>(type: "character varying(12)", unicode: false, maxLength: 12, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Backoffice", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Backoffice_Usuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuario",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Cliente",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Cpf = table.Column<string>(type: "character varying(11)", unicode: false, maxLength: 11, nullable: true),
                    IdUsuario = table.Column<Guid>(type: "uuid", nullable: false),
                    IdEmpresa = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Cliente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cliente_Empresa",
                        column: x => x.IdEmpresa,
                        principalTable: "Empresa",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Cliente_Usuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuario",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Endereco",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Pais = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Rua = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Numero = table.Column<int>(type: "integer", nullable: false),
                    Complemento = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Estado = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Cidade = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Bairro = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    IdUsuario = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Endereco", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Endereco_Usuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuario",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "HistoricoLogin",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateTime>(type: "TIMESTAMP", nullable: false),
                    Ip = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Local = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    IdUsuario = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.ForeignKey(
                        name: "FK_HistoricoLogin_Usuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuario",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Parceiros",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    idUsuario = table.Column<Guid>(type: "uuid", nullable: false),
                    idEmpresa = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    website = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    dataCriacao = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    contato = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    status = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Parceiros", x => x.id);
                    table.ForeignKey(
                        name: "FK_Parceiro_Empresa",
                        column: x => x.idEmpresa,
                        principalTable: "Empresa",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Parceiro_Usuario",
                        column: x => x.idUsuario,
                        principalTable: "Usuario",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Assinatura",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IdCliente = table.Column<Guid>(type: "uuid", nullable: false),
                    DataCompra = table.Column<DateTime>(type: "TIMESTAMP", nullable: false),
                    DataRenovacao = table.Column<DateTime>(type: "TIMESTAMP", nullable: false),
                    IdPagamento = table.Column<Guid>(type: "uuid", nullable: true),
                    idPlano = table.Column<Guid>(type: "uuid", nullable: false),
                    IdPlanoNavigationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Assinatura", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Assinatura_Cliente",
                        column: x => x.IdCliente,
                        principalTable: "Cliente",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Assinatura_Pagamento",
                        column: x => x.IdPagamento,
                        principalTable: "Pagamento",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Assinatura_Plano",
                        column: x => x.IdPlanoNavigationId,
                        principalTable: "Plano",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "OfertaParceiro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IdParceiro = table.Column<Guid>(type: "uuid", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "TIMESTAMP", nullable: false),
                    Validade = table.Column<DateTime>(type: "TIMESTAMP", nullable: false),
                    Descricao = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Categoria = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    IdEndereco = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeProduto = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Preco = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Desconto = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TipoProduto = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    TipoOferta = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    IdUsuarioCadastrante = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoriaCupom = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    Status = table.Column<bool>(type: "boolean", nullable: false),
                    QrCodePath = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_OfertaParceiro", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OfertaParceiro_Endereco",
                        column: x => x.IdEndereco,
                        principalTable: "Endereco",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OfertaParceiro_Parceiro",
                        column: x => x.IdParceiro,
                        principalTable: "Parceiros",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "CupomCliente",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DataResgate = table.Column<DateTime>(type: "TIMESTAMP", nullable: false),
                    DataUtilizacao = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IdOfertaParceiro = table.Column<Guid>(type: "uuid", nullable: false),
                    IdCliente = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_CupomCliente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CupomCliente_Cliente",
                        column: x => x.IdCliente,
                        principalTable: "Cliente",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CupomCliente_OfertaParceiro",
                        column: x => x.IdOfertaParceiro,
                        principalTable: "OfertaParceiro",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Imagem",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Path = table.Column<string>(type: "text", nullable: false),
                    IdOfertaParceiro = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Imagem", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Imagem_OfertaParceiro",
                        column: x => x.IdOfertaParceiro,
                        principalTable: "OfertaParceiro",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "HistoricoCupom",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IdCupom = table.Column<Guid>(type: "uuid", nullable: false),
                    IdUsuario = table.Column<Guid>(type: "uuid", nullable: false),
                    DataUso = table.Column<DateTime>(type: "TIMESTAMP", nullable: false),
                    Status = table.Column<string>(type: "character varying(255)", unicode: false, maxLength: 255, nullable: false),
                    idUsuarioNavigationId = table.Column<Guid>(type: "uuid", nullable: false),
                    idCupomClienteNavigationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_HistoricoCupom", x => x.Id);
                    table.ForeignKey(
                        name: "fK_HistoricoCupom_CupomCliente_idCupomClienteNavigationId",
                        column: x => x.idCupomClienteNavigationId,
                        principalTable: "CupomCliente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fK_HistoricoCupom_Usuario_idUsuarioNavigationId",
                        column: x => x.idUsuarioNavigationId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "iX_Assinatura_IdCliente",
                table: "Assinatura",
                column: "IdCliente");

            migrationBuilder.CreateIndex(
                name: "iX_Assinatura_IdPagamento",
                table: "Assinatura",
                column: "IdPagamento",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Assinatura_idPlanoNavigationId",
                table: "Assinatura",
                column: "IdPlanoNavigationId");

            migrationBuilder.CreateIndex(
                name: "iX_Backoffice_id",
                table: "Backoffice",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "iX_Backoffice_idUsuario",
                table: "Backoffice",
                column: "IdUsuario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Cliente_idEmpresa",
                table: "Cliente",
                column: "IdEmpresa",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Cliente_idUsuario",
                table: "Cliente",
                column: "IdUsuario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_CupomCliente_IdCliente",
                table: "CupomCliente",
                column: "IdCliente");

            migrationBuilder.CreateIndex(
                name: "iX_CupomCliente_idOfertaParceiro",
                table: "CupomCliente",
                column: "IdOfertaParceiro",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Endereco_IdUsuario",
                table: "Endereco",
                column: "IdUsuario");

            migrationBuilder.CreateIndex(
                name: "iX_HistoricoCupom_idCupomClienteNavigationId",
                table: "HistoricoCupom",
                column: "idCupomClienteNavigationId");

            migrationBuilder.CreateIndex(
                name: "iX_HistoricoCupom_idUsuarioNavigationId",
                table: "HistoricoCupom",
                column: "idUsuarioNavigationId");

            migrationBuilder.CreateIndex(
                name: "iX_HistoricoLogin_IdUsuario",
                table: "HistoricoLogin",
                column: "IdUsuario");

            migrationBuilder.CreateIndex(
                name: "iX_Imagem_IdOfertaParceiro",
                table: "Imagem",
                column: "IdOfertaParceiro");

            migrationBuilder.CreateIndex(
                name: "iX_OfertaParceiro_IdEndereco",
                table: "OfertaParceiro",
                column: "IdEndereco");

            migrationBuilder.CreateIndex(
                name: "iX_OfertaParceiro_IdParceiro",
                table: "OfertaParceiro",
                column: "IdParceiro");

            migrationBuilder.CreateIndex(
                name: "iX_Parceiros_idEmpresa",
                table: "Parceiros",
                column: "idEmpresa",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Parceiros_idUsuario",
                table: "Parceiros",
                column: "idUsuario",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Assinatura");

            migrationBuilder.DropTable(
                name: "Backoffice");

            migrationBuilder.DropTable(
                name: "HistoricoCupom");

            migrationBuilder.DropTable(
                name: "HistoricoLogin");

            migrationBuilder.DropTable(
                name: "Imagem");

            migrationBuilder.DropTable(
                name: "Notificacao");

            migrationBuilder.DropTable(
                name: "Pagamento");

            migrationBuilder.DropTable(
                name: "Plano");

            migrationBuilder.DropTable(
                name: "CupomCliente");

            migrationBuilder.DropTable(
                name: "Cliente");

            migrationBuilder.DropTable(
                name: "OfertaParceiro");

            migrationBuilder.DropTable(
                name: "Endereco");

            migrationBuilder.DropTable(
                name: "Parceiros");

            migrationBuilder.DropTable(
                name: "Empresa");

            migrationBuilder.DropTable(
                name: "Usuario");
        }
    }
}

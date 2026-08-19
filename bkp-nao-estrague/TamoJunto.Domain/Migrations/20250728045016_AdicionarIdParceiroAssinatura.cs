using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TamoJunto.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarIdParceiroAssinatura : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IdPlanoNavigationId",
                table: "Assinatura",
                newName: "idPlanoNavigationId");

            migrationBuilder.AlterColumn<decimal>(
                name: "Valor",
                table: "Plano",
                type: "numeric(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "Titulo",
                table: "Plano",
                type: "character varying(255)",
                unicode: false,
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Tipo",
                table: "Plano",
                type: "character varying(50)",
                unicode: false,
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<Guid>(
                name: "IdCliente",
                table: "Assinatura",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "IdParceiro",
                table: "Assinatura",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "iX_Assinatura_IdParceiro",
                table: "Assinatura",
                column: "IdParceiro");

            migrationBuilder.AddForeignKey(
                name: "FK_Assinatura_Parceiro",
                table: "Assinatura",
                column: "IdParceiro",
                principalTable: "Parceiros",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assinatura_Parceiro",
                table: "Assinatura");

            migrationBuilder.DropIndex(
                name: "iX_Assinatura_IdParceiro",
                table: "Assinatura");

            migrationBuilder.DropColumn(
                name: "IdParceiro",
                table: "Assinatura");

            migrationBuilder.RenameColumn(
                name: "idPlanoNavigationId",
                table: "Assinatura",
                newName: "IdPlanoNavigationId");

            migrationBuilder.AlterColumn<decimal>(
                name: "Valor",
                table: "Plano",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "Titulo",
                table: "Plano",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldUnicode: false,
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "Tipo",
                table: "Plano",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldUnicode: false,
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<Guid>(
                name: "IdCliente",
                table: "Assinatura",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}

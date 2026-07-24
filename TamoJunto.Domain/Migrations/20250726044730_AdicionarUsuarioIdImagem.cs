using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TamoJunto.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarUsuarioIdImagem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "Imagem",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "iX_Imagem_usuarioId",
                table: "Imagem",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Imagem_Usuario",
                table: "Imagem",
                column: "UsuarioId",
                principalTable: "Usuario",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Imagem_Usuario",
                table: "Imagem");

            migrationBuilder.DropIndex(
                name: "iX_Imagem_usuarioId",
                table: "Imagem");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Imagem");
        }
    }
}

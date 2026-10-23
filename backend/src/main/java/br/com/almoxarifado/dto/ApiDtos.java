package br.com.almoxarifado.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ApiDtos {
    private ApiDtos() {}

    public record LoginRequest(@NotBlank String usuario, @NotBlank String senha) {}
    public record FuncionarioDto(UUID id, String nome, String usuario, String perfil) {}
    public record LoginResponse(String token, FuncionarioDto funcionario) {}
    public record CriarFuncionarioRequest(@NotBlank @Size(max = 120) String nome,
                                          @NotBlank @Size(max = 80) String usuario,
                                          @NotBlank @Size(min = 6, max = 100) String senha) {}
    public record AtualizarFuncionarioRequest(@NotBlank @Size(max = 120) String nome,
                                               @NotBlank @Size(max = 80) String usuario,
                                               @Size(min = 6, max = 100) String senha) {}
    public record ProdutoDto(String produto, String nome, String marca, String coordenada,
                             int quantidade, int quantidadeMinima, int quantidadeIdeal) {}
    public record DetalhesProdutoRequest(@NotBlank @Size(max = 180) String nome,
                                         @Size(max = 120) String marca,
                                         @Size(max = 80) String coordenada) {}
    public record ParametrosProdutoRequest(@NotNull @Min(0) Integer quantidadeMinima,
                                          @NotNull @Min(0) Integer quantidadeIdeal) {}
    public record ItemMovimentacaoRequest(@NotBlank @Size(max = 180) String produto,
                                          @NotNull @Min(1) Integer quantidade) {}
    public record CriarMovimentacaoRequest(@NotBlank @Pattern(regexp = "inserir|retirar") String operacao,
                                           @NotEmpty List<@Valid ItemMovimentacaoRequest> itens,
                                           @Size(max = 200) String projetoDestino) {}
    public record MovimentacaoDto(UUID id, String produto, int quantidade, String operacao,
                                  UUID funcionarioId, String funcionarioNome, Instant data,
                                  String projetoDestino) {}
    public record MovimentoResponse(Map<String, Integer> estoque,
                                    List<ProdutoDto> produtosAbaixoDoMinimo,
                                    List<MovimentacaoDto> movimentacoes) {}
    public record ConfiguracaoReposicaoDto(String whatsapp,
                                          Map<String, Integer> quantidadesMinimas,
                                          Map<String, Integer> quantidadesIdeais) {}
    public record AtualizarWhatsappRequest(@NotBlank String numero) {}
    public record ItemReposicaoDto(String produto, int quantidadeAtual, int quantidadeMinima,
                                   int quantidadeIdeal, int quantidadeRepor) {}
    public record NotaReposicaoDto(String referencia, Instant data, List<ItemReposicaoDto> itens,
                                   String origem, String criadaPor) {}
    public record CriarNotaReposicaoRequest(@NotBlank @Pattern(regexp = "manual|automatica") String origem) {}
    public record ErrorDto(String message, Instant timestamp) {}
}

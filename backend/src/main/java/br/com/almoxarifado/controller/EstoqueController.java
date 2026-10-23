package br.com.almoxarifado.controller;

import br.com.almoxarifado.dto.ApiDtos;
import br.com.almoxarifado.service.EstoqueService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class EstoqueController {
    private final EstoqueService service;

    public EstoqueController(EstoqueService service) { this.service = service; }

    @GetMapping("/estoque")
    public Map<String, Integer> obterEstoque() { return service.obterEstoque(); }

    @GetMapping("/estoque/produtos")
    public List<ApiDtos.ProdutoDto> listarProdutos(@RequestParam(required = false) String busca) {
        return service.listarProdutos(busca);
    }

    @PostMapping("/estoque/movimentacoes")
    public ApiDtos.MovimentoResponse registrar(@Valid @RequestBody ApiDtos.CriarMovimentacaoRequest request,
                                               @AuthenticationPrincipal String funcionarioId) {
        return service.registrar(request, UUID.fromString(funcionarioId));
    }

    @GetMapping("/movimentacoes")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ApiDtos.MovimentacaoDto> listarMovimentacoes() { return service.listarMovimentacoes(); }

    @PutMapping("/produtos/{codigo}/detalhes")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiDtos.ProdutoDto atualizarDetalhes(@PathVariable String codigo,
                                                  @Valid @RequestBody ApiDtos.DetalhesProdutoRequest request) {
        return service.atualizarDetalhes(codigo, request);
    }

    @PutMapping("/produtos/{codigo}/parametros")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiDtos.ProdutoDto atualizarParametros(@PathVariable String codigo,
                                                    @Valid @RequestBody ApiDtos.ParametrosProdutoRequest request) {
        return service.atualizarParametros(codigo, request);
    }
}

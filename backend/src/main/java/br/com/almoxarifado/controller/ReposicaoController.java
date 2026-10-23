package br.com.almoxarifado.controller;

import br.com.almoxarifado.dto.ApiDtos;
import br.com.almoxarifado.service.ReposicaoService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ReposicaoController {
    private final ReposicaoService service;

    public ReposicaoController(ReposicaoService service) { this.service = service; }

    @GetMapping("/configuracoes/reposicao")
    public ApiDtos.ConfiguracaoReposicaoDto configuracao() { return service.obterConfiguracao(); }

    @PutMapping("/configuracoes/whatsapp")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiDtos.ConfiguracaoReposicaoDto atualizarWhatsapp(@Valid @RequestBody ApiDtos.AtualizarWhatsappRequest request) {
        service.atualizarWhatsapp(request.numero());
        return service.obterConfiguracao();
    }

    @GetMapping("/notas-reposicao")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ApiDtos.NotaReposicaoDto> listarNotas() { return service.listarNotas(); }

    @PostMapping("/notas-reposicao")
    public ApiDtos.NotaReposicaoDto criarNota(@Valid @RequestBody ApiDtos.CriarNotaReposicaoRequest request,
                                              @AuthenticationPrincipal String funcionarioId) {
        return service.criarNota(request.origem(), UUID.fromString(funcionarioId));
    }
}

package br.com.almoxarifado.controller;

import br.com.almoxarifado.dto.ApiDtos;
import br.com.almoxarifado.service.FuncionarioService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/funcionarios")
@PreAuthorize("hasRole('ADMIN')")
public class FuncionarioController {
    private final FuncionarioService service;

    public FuncionarioController(FuncionarioService service) { this.service = service; }

    @GetMapping
    public List<ApiDtos.FuncionarioDto> listar() { return service.listar(); }

    @PostMapping
    public ApiDtos.FuncionarioDto criar(@Valid @RequestBody ApiDtos.CriarFuncionarioRequest request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public ApiDtos.FuncionarioDto atualizar(@PathVariable UUID id,
                                           @Valid @RequestBody ApiDtos.AtualizarFuncionarioRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable UUID id) { service.excluir(id); }
}

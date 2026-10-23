package br.com.almoxarifado.controller;

import br.com.almoxarifado.config.JwtService;
import br.com.almoxarifado.dto.ApiDtos;
import br.com.almoxarifado.entity.Funcionario;
import br.com.almoxarifado.service.FuncionarioService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final FuncionarioService funcionarioService;
    private final JwtService jwtService;

    public AuthController(FuncionarioService funcionarioService, JwtService jwtService) {
        this.funcionarioService = funcionarioService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ApiDtos.LoginResponse login(@Valid @RequestBody ApiDtos.LoginRequest request) {
        ApiDtos.FuncionarioDto funcionarioDto = funcionarioService.autenticar(request.usuario(), request.senha());
        Funcionario funcionario = funcionarioService.buscarEntidade(funcionarioDto.id());
        return new ApiDtos.LoginResponse(jwtService.gerarToken(funcionario), funcionarioDto);
    }

    @GetMapping("/me")
    public ApiDtos.FuncionarioDto me(@AuthenticationPrincipal String funcionarioId) {
        return FuncionarioService.paraDto(funcionarioService.buscarEntidade(UUID.fromString(funcionarioId)));
    }
}

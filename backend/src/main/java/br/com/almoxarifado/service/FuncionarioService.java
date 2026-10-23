package br.com.almoxarifado.service;

import br.com.almoxarifado.dto.ApiDtos;
import br.com.almoxarifado.entity.Funcionario;
import br.com.almoxarifado.entity.Perfil;
import br.com.almoxarifado.repository.FuncionarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class FuncionarioService {
    private final FuncionarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public FuncionarioService(FuncionarioRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public ApiDtos.FuncionarioDto autenticar(String usuario, String senha) {
        Funcionario funcionario = repository.findByUsuarioIgnoreCase(usuario.trim()).orElse(null);
        if (funcionario == null || !funcionario.isAtivo() || !passwordEncoder.matches(senha, funcionario.getSenhaHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário ou senha inválidos.");
        }
        return paraDto(funcionario);
    }

    @Transactional(readOnly = true)
    public Funcionario buscarEntidade(UUID id) {
        return repository.findById(id)
            .filter(Funcionario::isAtivo)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida. Entre novamente."));
    }

    @Transactional(readOnly = true)
    public List<ApiDtos.FuncionarioDto> listar() {
        return repository.findAllByOrderByNomeAsc().stream()
            .filter(Funcionario::isAtivo).map(FuncionarioService::paraDto).toList();
    }

    @Transactional
    public ApiDtos.FuncionarioDto criar(ApiDtos.CriarFuncionarioRequest request) {
        String usuario = normalizarUsuario(request.usuario());
        if (repository.existsByUsuarioIgnoreCase(usuario)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este nome de usuário já está cadastrado.");
        }
        Funcionario novo = new Funcionario(request.nome().trim(), usuario,
            passwordEncoder.encode(request.senha()), Perfil.FUNCIONARIO);
        return paraDto(repository.save(novo));
    }

    @Transactional
    public ApiDtos.FuncionarioDto atualizar(UUID id, ApiDtos.AtualizarFuncionarioRequest request) {
        Funcionario funcionario = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funcionário não encontrado."));
        if (funcionario.getPerfil() == Perfil.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é permitido editar este administrador por esta tela.");
        }
        String usuario = normalizarUsuario(request.usuario());
        repository.findByUsuarioIgnoreCase(usuario).ifPresent(outro -> {
            if (!outro.getId().equals(id)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Este nome de usuário já está cadastrado.");
        });
        funcionario.setNome(request.nome().trim());
        funcionario.setUsuario(usuario);
        if (request.senha() != null && !request.senha().isBlank()) {
            funcionario.setSenhaHash(passwordEncoder.encode(request.senha()));
        }
        return paraDto(repository.save(funcionario));
    }

    @Transactional
    public void excluir(UUID id) {
        Funcionario funcionario = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funcionário não encontrado."));
        if (funcionario.getPerfil() == Perfil.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é permitido excluir um administrador por esta tela.");
        }
        // Desativar preserva as referências do histórico de movimentações.
        funcionario.setAtivo(false);
        repository.save(funcionario);
    }

    public static ApiDtos.FuncionarioDto paraDto(Funcionario funcionario) {
        return new ApiDtos.FuncionarioDto(
            funcionario.getId(), funcionario.getNome(), funcionario.getUsuario(),
            funcionario.getPerfil() == Perfil.ADMIN ? "administrador" : "funcionario"
        );
    }

    private String normalizarUsuario(String usuario) {
        return usuario.trim().toLowerCase(java.util.Locale.ROOT);
    }
}

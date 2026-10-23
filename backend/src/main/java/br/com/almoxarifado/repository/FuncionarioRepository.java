package br.com.almoxarifado.repository;

import br.com.almoxarifado.entity.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.Optional;
import java.util.List;

public interface FuncionarioRepository extends JpaRepository<Funcionario, UUID> {
    Optional<Funcionario> findByUsuarioIgnoreCase(String usuario);
    boolean existsByUsuarioIgnoreCase(String usuario);
    List<Funcionario> findAllByOrderByNomeAsc();
}

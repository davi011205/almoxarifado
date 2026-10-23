package br.com.almoxarifado.repository;

import br.com.almoxarifado.entity.NotaReposicao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface NotaReposicaoRepository extends JpaRepository<NotaReposicao, UUID> {
    List<NotaReposicao> findAllByOrderByDataDesc();
}

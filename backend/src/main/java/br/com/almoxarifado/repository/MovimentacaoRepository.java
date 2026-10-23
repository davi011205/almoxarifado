package br.com.almoxarifado.repository;

import br.com.almoxarifado.entity.Movimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface MovimentacaoRepository extends JpaRepository<Movimentacao, UUID> {
    List<Movimentacao> findAllByOrderByDataDesc();
}

package br.com.almoxarifado.repository;

import br.com.almoxarifado.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.Optional;
import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, String> {
    Optional<Produto> findByCodigoIgnoreCase(String codigo);
    List<Produto> findAllByOrderByCodigoAsc();
}

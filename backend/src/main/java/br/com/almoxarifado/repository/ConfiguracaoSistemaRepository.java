package br.com.almoxarifado.repository;

import br.com.almoxarifado.entity.ConfiguracaoSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ConfiguracaoSistemaRepository extends JpaRepository<ConfiguracaoSistema, String> {}

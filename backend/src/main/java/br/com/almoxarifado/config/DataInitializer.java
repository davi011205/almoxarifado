package br.com.almoxarifado.config;

import br.com.almoxarifado.entity.ConfiguracaoSistema;
import br.com.almoxarifado.entity.Funcionario;
import br.com.almoxarifado.entity.Perfil;
import br.com.almoxarifado.repository.ConfiguracaoSistemaRepository;
import br.com.almoxarifado.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner inicializarDados(FuncionarioRepository funcionarioRepository,
                                       ConfiguracaoSistemaRepository configuracaoRepository,
                                       PasswordEncoder passwordEncoder,
                                       @Value("${app.admin.username:davi}") String usuarioAdmin, 
                                       @Value("${app.admin.password:1234}") String senhaAdmin,
                                       @Value("${app.admin.name:Administrador}") String nomeAdmin,
                                       @Value("${app.whatsapp.default:5531986608306}") String whatsappPadrao) {
        return args -> {
            if (!funcionarioRepository.existsByUsuarioIgnoreCase(usuarioAdmin)) {
                funcionarioRepository.save(new Funcionario(
                    nomeAdmin, usuarioAdmin.trim().toLowerCase(), passwordEncoder.encode(senhaAdmin), Perfil.ADMIN
                ));
            }
            if (!configuracaoRepository.existsById("global")) {
                configuracaoRepository.save(new ConfiguracaoSistema("global", whatsappPadrao.replaceAll("\\D", "")));
            }
        };
    }
}

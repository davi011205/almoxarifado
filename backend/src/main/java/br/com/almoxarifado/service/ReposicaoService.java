package br.com.almoxarifado.service;

import br.com.almoxarifado.dto.ApiDtos;
import br.com.almoxarifado.entity.ConfiguracaoSistema;
import br.com.almoxarifado.entity.Funcionario;
import br.com.almoxarifado.entity.NotaReposicao;
import br.com.almoxarifado.entity.NotaReposicaoItem;
import br.com.almoxarifado.entity.Perfil;
import br.com.almoxarifado.entity.Produto;
import br.com.almoxarifado.repository.ConfiguracaoSistemaRepository;
import br.com.almoxarifado.repository.FuncionarioRepository;
import br.com.almoxarifado.repository.NotaReposicaoRepository;
import br.com.almoxarifado.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@Service
public class ReposicaoService {
    private final ProdutoRepository produtoRepository;
    private final NotaReposicaoRepository notaRepository;
    private final FuncionarioRepository funcionarioRepository;
    private final ConfiguracaoSistemaRepository configuracaoRepository;
    private final String whatsappPadrao;

    public ReposicaoService(ProdutoRepository produtoRepository,
                            NotaReposicaoRepository notaRepository,
                            FuncionarioRepository funcionarioRepository,
                            ConfiguracaoSistemaRepository configuracaoRepository,
                            @Value("${app.whatsapp.default:5531988608306}") String whatsappPadrao) {
        this.produtoRepository = produtoRepository;
        this.notaRepository = notaRepository;
        this.funcionarioRepository = funcionarioRepository;
        this.configuracaoRepository = configuracaoRepository;
        this.whatsappPadrao = whatsappPadrao;
    }

    @Transactional(readOnly = true)
    public ApiDtos.ConfiguracaoReposicaoDto obterConfiguracao() {
        List<Produto> produtos = produtoRepository.findAllByOrderByCodigoAsc();
        Map<String, Integer> minimos = new LinkedHashMap<>();
        Map<String, Integer> ideais = new LinkedHashMap<>();
        for (Produto p : produtos) {
            minimos.put(p.getCodigo(), p.getQuantidadeMinima());
            ideais.put(p.getCodigo(), p.getQuantidadeIdeal());
        }
        String whatsapp = configuracaoRepository.findById("global")
            .map(ConfiguracaoSistema::getWhatsappReposicao).orElse(whatsappPadrao);
        return new ApiDtos.ConfiguracaoReposicaoDto(whatsapp, minimos, ideais);
    }

    @Transactional
    public String atualizarWhatsapp(String numero) {
        String normalizado = numero == null ? "" : numero.replaceAll("\\D", "");
        if (normalizado.length() < 10 || normalizado.length() > 15) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Informe o WhatsApp com código do país e DDD, entre 10 e 15 dígitos.");
        }
        ConfiguracaoSistema configuracao = configuracaoRepository.findById("global")
            .orElseGet(() -> new ConfiguracaoSistema("global", whatsappPadrao));
        configuracao.setWhatsappReposicao(normalizado);
        configuracaoRepository.save(configuracao);
        return normalizado;
    }

    @Transactional(readOnly = true)
    public List<ApiDtos.NotaReposicaoDto> listarNotas() {
        return notaRepository.findAllByOrderByDataDesc().stream().map(ReposicaoService::notaDto).toList();
    }

    @Transactional
    public ApiDtos.NotaReposicaoDto criarNota(String origem, UUID funcionarioId) {
        Funcionario funcionario = funcionarioRepository.findById(funcionarioId)
            .filter(Funcionario::isAtivo)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Funcionário não encontrado."));

        if ("manual".equals(origem) && funcionario.getPerfil() != Perfil.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Somente o administrador pode gerar uma nota manualmente.");
        }
        // A lista é sempre calculada no backend, usando o saldo e os limites persistidos.
        List<Produto> emFalta = produtoRepository.findAllByOrderByCodigoAsc().stream()
            .filter(p -> p.getQuantidade() < p.getQuantidadeMinima())
            .sorted(Comparator.comparingInt(Produto::getQuantidade).thenComparing(Produto::getCodigo))
            .toList();
        if (emFalta.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não há produtos abaixo do estoque mínimo neste momento.");
        }

        String referencia = "REP-" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        NotaReposicao nota = new NotaReposicao(referencia, origem, funcionario.getNome());
        for (Produto produto : emFalta) {
            nota.adicionarItem(new NotaReposicaoItem(produto.getCodigo(), produto.getQuantidade(),
                produto.getQuantidadeMinima(), produto.getQuantidadeIdeal()));
        }
        return notaDto(notaRepository.save(nota));
    }

    private static ApiDtos.NotaReposicaoDto notaDto(NotaReposicao nota) {
        List<ApiDtos.ItemReposicaoDto> itens = nota.getItens().stream()
            .map(item -> new ApiDtos.ItemReposicaoDto(item.getProduto(), item.getQuantidadeAtual(),
                item.getQuantidadeMinima(), item.getQuantidadeIdeal(), item.getQuantidadeRepor()))
            .toList();
        return new ApiDtos.NotaReposicaoDto(nota.getReferencia(), nota.getData(), itens, nota.getOrigem(), nota.getCriadaPor());
    }
}

package br.com.almoxarifado.service;

import br.com.almoxarifado.dto.ApiDtos;
import br.com.almoxarifado.entity.*;
import br.com.almoxarifado.repository.FuncionarioRepository;
import br.com.almoxarifado.repository.MovimentacaoRepository;
import br.com.almoxarifado.repository.ProdutoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EstoqueService {
    private final ProdutoRepository produtoRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final FuncionarioRepository funcionarioRepository;

    public EstoqueService(ProdutoRepository produtoRepository,
                         MovimentacaoRepository movimentacaoRepository,
                         FuncionarioRepository funcionarioRepository) {
        this.produtoRepository = produtoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.funcionarioRepository = funcionarioRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Integer> obterEstoque() {
        Map<String, Integer> estoque = new LinkedHashMap<>();
        produtoRepository.findAllByOrderByCodigoAsc().forEach(p -> estoque.put(p.getCodigo(), p.getQuantidade()));
        return estoque;
    }

    @Transactional(readOnly = true)
    public List<ApiDtos.ProdutoDto> listarProdutos(String busca) {
        String termo = busca == null ? "" : busca.trim().toLowerCase(Locale.ROOT);
        return produtoRepository.findAllByOrderByCodigoAsc().stream()
            .filter(p -> termo.isBlank()
                || p.getCodigo().toLowerCase(Locale.ROOT).contains(termo)
                || (p.getNome() != null && p.getNome().toLowerCase(Locale.ROOT).contains(termo))
                || (p.getMarca() != null && p.getMarca().toLowerCase(Locale.ROOT).contains(termo))
                || (p.getCoordenada() != null && p.getCoordenada().toLowerCase(Locale.ROOT).contains(termo)))
            .map(EstoqueService::produtoDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ApiDtos.MovimentacaoDto> listarMovimentacoes() {
        return movimentacaoRepository.findAllByOrderByDataDesc().stream().map(EstoqueService::movimentacaoDto).toList();
    }

    @Transactional
    public ApiDtos.MovimentoResponse registrar(ApiDtos.CriarMovimentacaoRequest request, UUID funcionarioId) {
        Funcionario funcionario = funcionarioRepository.findById(funcionarioId)
            .filter(Funcionario::isAtivo)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Funcionário não encontrado."));
        Operacao operacao = "inserir".equals(request.operacao()) ? Operacao.ENTRADA : Operacao.RETIRADA;

        // Consolida produtos duplicados e valida o lote inteiro antes de qualquer alteração.
        Map<String, Integer> quantidadesPorProduto = new LinkedHashMap<>();
        for (ApiDtos.ItemMovimentacaoRequest item : request.itens()) {
            String codigo = item.produto().trim();
            if (codigo.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o produto.");
            String codigoExistente = produtoRepository.findByCodigoIgnoreCase(codigo)
                .map(Produto::getCodigo).orElse(codigo);
            long novaQuantidade = (long) quantidadesPorProduto.getOrDefault(codigoExistente, 0) + item.quantidade();
            if (novaQuantidade > Integer.MAX_VALUE) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade muito alta para o produto " + codigo + ".");
            quantidadesPorProduto.put(codigoExistente, (int) novaQuantidade);
        }

        Map<String, Produto> produtos = new LinkedHashMap<>();
        for (Map.Entry<String, Integer> entrada : quantidadesPorProduto.entrySet()) {
            Produto produto = produtoRepository.findByCodigoIgnoreCase(entrada.getKey()).orElse(null);
            if (produto == null) {
                if (operacao == Operacao.RETIRADA) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O produto " + entrada.getKey() + " não possui saldo cadastrado.");
                }
                produto = new Produto(entrada.getKey());
            }
            if (operacao == Operacao.RETIRADA && entrada.getValue() > produto.getQuantidade()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Estoque insuficiente para " + entrada.getKey() + ". Saldo disponível: " + produto.getQuantidade() + ".");
            }
            produtos.put(entrada.getKey(), produto);
        }

        List<Movimentacao> novasMovimentacoes = new ArrayList<>();
        for (Map.Entry<String, Integer> entrada : quantidadesPorProduto.entrySet()) {
            Produto produto = produtos.get(entrada.getKey());
            int quantidade = entrada.getValue();
            int saldo = operacao == Operacao.ENTRADA
                ? Math.addExact(produto.getQuantidade(), quantidade)
                : produto.getQuantidade() - quantidade;
            produto.setQuantidade(saldo);
            produtoRepository.save(produto);
            novasMovimentacoes.add(new Movimentacao(produto, quantidade, operacao, funcionario,
                request.projetoDestino() == null ? null : request.projetoDestino().trim()));
        }
        movimentacaoRepository.saveAll(novasMovimentacoes);
        movimentacaoRepository.flush();

        Map<String, Integer> estoque = obterEstoque();
        List<ApiDtos.ProdutoDto> abaixoMinimo = produtoRepository.findAllByOrderByCodigoAsc().stream()
            .filter(p -> p.getQuantidade() < p.getQuantidadeMinima())
            .map(EstoqueService::produtoDto).toList();

        return new ApiDtos.MovimentoResponse(estoque, abaixoMinimo,
            novasMovimentacoes.stream().map(EstoqueService::movimentacaoDto).toList());
    }

    @Transactional
    public ApiDtos.ProdutoDto atualizarParametros(String codigo, ApiDtos.ParametrosProdutoRequest request) {
        String produtoCodigo = codigo == null ? "" : codigo.trim();
        if (produtoCodigo.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código de produto inválido.");
        Produto produto = produtoRepository.findByCodigoIgnoreCase(produtoCodigo).orElse(null);
        if (produto == null) {
            produto = new Produto(produtoCodigo);
        }
        produto.setQuantidadeMinima(request.quantidadeMinima());
        produto.setQuantidadeIdeal(request.quantidadeIdeal());
        return produtoDto(produtoRepository.save(produto));
    }

    @Transactional
    public ApiDtos.ProdutoDto atualizarDetalhes(String codigo, ApiDtos.DetalhesProdutoRequest request) {
        String produtoCodigo = codigo == null ? "" : codigo.trim();
        if (produtoCodigo.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código de produto inválido.");
        Produto produto = produtoRepository.findByCodigoIgnoreCase(produtoCodigo).orElseGet(() -> new Produto(produtoCodigo));
        produto.setNome(request.nome().trim());
        produto.setMarca(request.marca() == null || request.marca().isBlank() ? null : request.marca().trim());
        produto.setCoordenada(request.coordenada() == null || request.coordenada().isBlank() ? null : request.coordenada().trim());
        return produtoDto(produtoRepository.save(produto));
    }

    public static ApiDtos.ProdutoDto produtoDto(Produto p) {
        return new ApiDtos.ProdutoDto(p.getCodigo(), p.getNome(), p.getMarca(), p.getCoordenada(),
            p.getQuantidade(), p.getQuantidadeMinima(), p.getQuantidadeIdeal());
    }

    public static ApiDtos.MovimentacaoDto movimentacaoDto(Movimentacao m) {
        return new ApiDtos.MovimentacaoDto(
            m.getId(), m.getProduto().getCodigo(), m.getQuantidade(),
            m.getOperacao() == Operacao.ENTRADA ? "inserir" : "retirar",
            m.getFuncionario().getId(), m.getFuncionario().getNome(), m.getData(), m.getProjetoDestino()
        );
    }
}

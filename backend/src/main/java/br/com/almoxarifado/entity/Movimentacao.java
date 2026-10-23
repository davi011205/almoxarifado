package br.com.almoxarifado.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "movimentacoes", indexes = {
    @Index(name = "idx_movimentacoes_data", columnList = "data_movimentacao"),
    @Index(name = "idx_movimentacoes_produto", columnList = "produto_codigo")
})
public class Movimentacao {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_codigo", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private int quantidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Operacao operacao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Funcionario funcionario;

    @Column(name = "data_movimentacao", nullable = false)
    private Instant data = Instant.now();

    @Column(name = "projeto_destino", length = 200)
    private String projetoDestino;

    protected Movimentacao() {}

    public Movimentacao(Produto produto, int quantidade, Operacao operacao, Funcionario funcionario, String projetoDestino) {
        this.produto = produto;
        this.quantidade = quantidade;
        this.operacao = operacao;
        this.funcionario = funcionario;
        this.projetoDestino = projetoDestino;
        this.data = Instant.now();
    }

    public UUID getId() { return id; }
    public Produto getProduto() { return produto; }
    public int getQuantidade() { return quantidade; }
    public Operacao getOperacao() { return operacao; }
    public Funcionario getFuncionario() { return funcionario; }
    public Instant getData() { return data; }
    public String getProjetoDestino() { return projetoDestino; }
}

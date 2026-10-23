package br.com.almoxarifado.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "itens_nota_reposicao")
public class NotaReposicaoItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "nota_id", nullable = false)
    private NotaReposicao nota;

    @Column(nullable = false, length = 180)
    private String produto;

    @Column(name = "quantidade_atual", nullable = false)
    private int quantidadeAtual;

    @Column(name = "quantidade_minima", nullable = false)
    private int quantidadeMinima;

    @Column(name = "quantidade_ideal", nullable = false)
    private int quantidadeIdeal;

    @Column(name = "quantidade_repor", nullable = false)
    private int quantidadeRepor;

    protected NotaReposicaoItem() {}

    public NotaReposicaoItem(String produto, int quantidadeAtual, int quantidadeMinima, int quantidadeIdeal) {
        this.produto = produto;
        this.quantidadeAtual = quantidadeAtual;
        this.quantidadeMinima = quantidadeMinima;
        this.quantidadeIdeal = quantidadeIdeal;
        this.quantidadeRepor = Math.max(0, quantidadeIdeal - quantidadeAtual);
    }

    void setNota(NotaReposicao nota) { this.nota = nota; }
    public String getProduto() { return produto; }
    public int getQuantidadeAtual() { return quantidadeAtual; }
    public int getQuantidadeMinima() { return quantidadeMinima; }
    public int getQuantidadeIdeal() { return quantidadeIdeal; }
    public int getQuantidadeRepor() { return quantidadeRepor; }
}

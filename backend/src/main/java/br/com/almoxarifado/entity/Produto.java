package br.com.almoxarifado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "produtos")
public class Produto {
    @Id
    @Column(name = "codigo", nullable = false, length = 180)
    private String codigo;

    @Column(nullable = false, length = 180)
    private String nome;

    @Column(length = 120)
    private String marca;

    @Column(length = 80)
    private String coordenada;

    @Column(nullable = false)
    private int quantidade = 0;

    @Column(name = "quantidade_minima", nullable = false)
    private int quantidadeMinima = 10;

    @Column(name = "quantidade_ideal", nullable = false)
    private int quantidadeIdeal = 50;

    @Version
    private Long versao;

    protected Produto() {}

    public Produto(String codigo) {
        this.codigo = codigo;
        this.nome = codigo;
        this.quantidade = 0;
        this.quantidadeMinima = 10;
        this.quantidadeIdeal = 50;
    }

    @PrePersist
    void definirPadroes() {
        if (nome == null || nome.isBlank()) nome = codigo;
        if (quantidadeMinima < 0) quantidadeMinima = 10;
        if (quantidadeIdeal < 0) quantidadeIdeal = 50;
    }

    public String getCodigo() { return codigo; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }
    public String getCoordenada() { return coordenada; }
    public void setCoordenada(String coordenada) { this.coordenada = coordenada; }
    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
    public int getQuantidadeMinima() { return quantidadeMinima; }
    public void setQuantidadeMinima(int quantidadeMinima) { this.quantidadeMinima = quantidadeMinima; }
    public int getQuantidadeIdeal() { return quantidadeIdeal; }
    public void setQuantidadeIdeal(int quantidadeIdeal) { this.quantidadeIdeal = quantidadeIdeal; }
}

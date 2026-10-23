package br.com.almoxarifado.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "notas_reposicao")
public class NotaReposicao {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String referencia;

    @Column(nullable = false)
    private Instant data = Instant.now();

    @Column(nullable = false, length = 30)
    private String origem;

    @Column(name = "criada_por", nullable = false, length = 120)
    private String criadaPor;

    @OneToMany(mappedBy = "nota", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NotaReposicaoItem> itens = new ArrayList<>();

    protected NotaReposicao() {}

    public NotaReposicao(String referencia, String origem, String criadaPor) {
        this.referencia = referencia;
        this.origem = origem;
        this.criadaPor = criadaPor;
        this.data = Instant.now();
    }

    public void adicionarItem(NotaReposicaoItem item) {
        itens.add(item);
        item.setNota(this);
    }

    public UUID getId() { return id; }
    public String getReferencia() { return referencia; }
    public Instant getData() { return data; }
    public String getOrigem() { return origem; }
    public String getCriadaPor() { return criadaPor; }
    public List<NotaReposicaoItem> getItens() { return itens; }
}

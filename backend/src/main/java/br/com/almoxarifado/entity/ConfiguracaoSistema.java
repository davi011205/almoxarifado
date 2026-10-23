package br.com.almoxarifado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "configuracoes_sistema")
public class ConfiguracaoSistema {
    @Id
    @Column(length = 40)
    private String id;

    @Column(name = "whatsapp_reposicao", nullable = false, length = 20)
    private String whatsappReposicao;

    protected ConfiguracaoSistema() {}

    public ConfiguracaoSistema(String id, String whatsappReposicao) {
        this.id = id;
        this.whatsappReposicao = whatsappReposicao;
    }

    public String getId() { return id; }
    public String getWhatsappReposicao() { return whatsappReposicao; }
    public void setWhatsappReposicao(String whatsappReposicao) { this.whatsappReposicao = whatsappReposicao; }
}

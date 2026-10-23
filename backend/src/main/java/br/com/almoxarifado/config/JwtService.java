package br.com.almoxarifado.config;

import br.com.almoxarifado.entity.Funcionario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-ms:28800000}") long expirationMs) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalArgumentException("JWT_SECRET precisa ter pelo menos 32 bytes.");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = expirationMs;
    }

    public String gerarToken(Funcionario funcionario) {
        Instant agora = Instant.now();
        return Jwts.builder()
            .subject(funcionario.getId().toString())
            .claim("usuario", funcionario.getUsuario())
            .claim("perfil", funcionario.getPerfil().name())
            .issuedAt(Date.from(agora))
            .expiration(Date.from(agora.plusMillis(expirationMs)))
            .signWith(key)
            .compact();
    }

    public UUID lerFuncionarioId(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return UUID.fromString(claims.getSubject());
    }
}

package com.palanas.portrait.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${portrait.jwt.secret:}")
    private String configuredSecret;

    private Key key;
    private final long expirationMs = 24 * 3600 * 1000;

    @PostConstruct
    public void init() {
        try {
            if (configuredSecret != null && !configuredSecret.isBlank()) {
                // allow a raw string secret; ensure it's long enough for HS256
                byte[] bytes = configuredSecret.getBytes(StandardCharsets.UTF_8);
                if (bytes.length < 32) {
                    // pad/repeat to reach 32 bytes
                    byte[] padded = new byte[32];
                    for (int i = 0; i < padded.length; i++) padded[i] = bytes[i % bytes.length];
                    bytes = padded;
                }
                this.key = Keys.hmacShaKeyFor(bytes);
            } else {
                // fallback to a random key (tokens won't survive restarts)
                this.key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            }
        } catch (Exception ex) {
            this.key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        }
    }

    public String generateToken(String subject, String role) {
        return Jwts.builder()
                .setSubject(subject)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    public io.jsonwebtoken.Claims parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }
}

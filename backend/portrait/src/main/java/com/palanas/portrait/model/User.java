package com.palanas.portrait.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public Long id;
    public String name;
    public String email;
    public String passwordHash;
    public String role; // "customer" or "artist"

    public User() {}
    public User(String name, String email, String passwordHash, String role) { this.name = name; this.email = email; this.passwordHash = passwordHash; this.role = role; }
}

package com.palanas.portrait.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import java.io.Serializable;

@Entity
public class Artist implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public Long id;
    public String name;
    public String email;
    public String profilePhotoPath;
    public String bio;
    public String nickname;
    
    public Artist() {}
    public Artist(String name, String email) { this.name = name; this.email = email; }
    
}

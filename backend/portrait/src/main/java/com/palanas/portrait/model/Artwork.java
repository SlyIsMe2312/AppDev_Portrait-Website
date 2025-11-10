package com.palanas.portrait.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class Artwork {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public Long id;

    public Long artistId;
    public String title;
    public String imagePath;
    public LocalDateTime createdAt = LocalDateTime.now();

    public Artwork() {}
    public Artwork(Long artistId, String title, String imagePath) { this.artistId = artistId; this.title = title; this.imagePath = imagePath; }
}

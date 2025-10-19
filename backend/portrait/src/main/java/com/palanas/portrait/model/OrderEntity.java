package com.palanas.portrait.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public Long id;

    public String customerName;
    public String customerEmail;

    public Long artistId;
    public Long frameId;
    public String sizeLabel;

    // saved path to processed image
    public String processedImagePath;

    public Double price;

    public LocalDateTime createdAt = LocalDateTime.now();
}

package com.palanas.portrait.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.io.Serializable;

@Entity
public class Frame implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public Long id;
    public String name;
    // path or URL to overlay PNG stored in server `frames/` directory
    public String overlayPath;
    public Double basePrice;
    public Double aspectRatio;
}

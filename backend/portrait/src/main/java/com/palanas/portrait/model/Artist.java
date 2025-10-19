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
    
    Long id;
    String name;
    String email;
    
}

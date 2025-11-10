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

    // public URL to access the processed image (served by /api/files/{filename})
    public String processedImageUrl;

    // optional progress image uploaded by artist during fulfillment
    public String progressImagePath;
    public String progressImageUrl;

    // order workflow status: RECEIVED, ACCEPTED, IN_PROGRESS, COMPLETED, AWAITING_PAYMENT, PAID, CANCELLED
    public String status = "RECEIVED";

    // payment flag
    public Boolean paid = false;

    // when true the order is hidden from active order lists
    public Boolean archived = false;

    public Double price;

    public LocalDateTime createdAt = LocalDateTime.now();
}

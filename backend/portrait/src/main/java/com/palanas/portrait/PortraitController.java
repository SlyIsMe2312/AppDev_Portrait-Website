package com.palanas.portrait;

import com.palanas.portrait.model.Frame;
import com.palanas.portrait.model.OrderEntity;
import com.palanas.portrait.repo.ArtistRepository;
import com.palanas.portrait.repo.FrameRepository;
import com.palanas.portrait.repo.OrderRepository;
import com.palanas.portrait.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class PortraitController {

    @Autowired
    ArtistRepository artistRepository;

    @Autowired
    FrameRepository frameRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    ImageService imageService;

    @Autowired
    com.palanas.portrait.security.JwtUtil jwtUtil;

    @GetMapping("/artists")
    public ResponseEntity<?> artists() {
        return ResponseEntity.ok(artistRepository.findAll());
    }

    @GetMapping("/frames")
    public ResponseEntity<?> frames() {
        return ResponseEntity.ok(frameRepository.findAll());
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestHeader(value = "Authorization", required = false) String auth,
                                         @RequestParam("image") MultipartFile image,
                                         @RequestParam(required = false) Long artistId,
                                         @RequestParam(required = false) Long frameId,
                                         @RequestParam(required = false) String size,
                                         @RequestParam(required = false) String customerName,
                                         @RequestParam(required = false) String customerEmail) {
        try {
            if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
            String token = auth.substring(7);
            try { jwtUtil.parse(token); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
            String processedPath = imageService.processAndSave(image);

            OrderEntity o = new OrderEntity();
            o.artistId = artistId;
            o.frameId = frameId;
            o.sizeLabel = size;
            o.customerName = customerName;
            o.customerEmail = customerEmail;
            o.processedImagePath = processedPath;

            // compute price based on frame basePrice and size multiplier
            double price = 49.99;
            if (frameId != null) {
                Frame f = frameRepository.findById(frameId).orElse(null);
                if (f != null && f.basePrice != null) {
                    double base = f.basePrice;
                    double mult = 1.0;
                    if ("small".equalsIgnoreCase(size)) mult = 1.0;
                    else if ("medium".equalsIgnoreCase(size)) mult = 1.5;
                    else if ("large".equalsIgnoreCase(size)) mult = 2.0;
                    price = Math.round(base * mult * 100.0) / 100.0;
                }
            }
            o.price = price;

            OrderEntity saved = orderRepository.save(o);
            return ResponseEntity.ok(saved);
        } catch (IOException ex) {
            return ResponseEntity.status(500).body("Failed to process image: " + ex.getMessage());
        }
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(o -> ResponseEntity.ok(o))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/orders/{id}/image")
    public ResponseEntity<?> getOrderImage(@PathVariable Long id) {
        return orderRepository.findById(id).map(o -> {
            try {
                java.nio.file.Path p = java.nio.file.Paths.get(o.processedImagePath);
                if (!java.nio.file.Files.exists(p)) return ResponseEntity.notFound().build();
                org.springframework.core.io.Resource res = new org.springframework.core.io.PathResource(p);
                return ResponseEntity.ok()
                        .header("Content-Type", "image/png")
                        .body(res);
            } catch (Exception ex) {
                return ResponseEntity.status(500).body("Failed to read image: " + ex.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}

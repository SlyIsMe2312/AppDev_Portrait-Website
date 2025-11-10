package com.palanas.portrait;

import com.palanas.portrait.model.Frame;
import com.palanas.portrait.model.OrderEntity;
import com.palanas.portrait.repo.ArtistRepository;
import com.palanas.portrait.repo.FrameRepository;
import com.palanas.portrait.repo.OrderRepository;
import com.palanas.portrait.service.ImageService;
import com.palanas.portrait.repo.ArtworkRepository;
import com.palanas.portrait.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class PortraitController {

    @Autowired
    ArtistRepository artistRepository;

    @Autowired
    ArtworkRepository artworkRepository;

    @Autowired
    FrameRepository frameRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    ImageService imageService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    com.palanas.portrait.security.JwtUtil jwtUtil;

    @GetMapping("/artists")
    public ResponseEntity<?> artists() {
        return ResponseEntity.ok(artistRepository.findAll());
    }

    @GetMapping("/artists/{id}")
    public ResponseEntity<?> getArtist(@PathVariable Long id) {
        return artistRepository.findById(id).map(a -> {
            var artworks = artworkRepository.findByArtistId(id);
            // attempt to include user's privacy settings (nickname, showEmail) from the User record
            var userOpt = userRepository.findByEmail(a.email);
            String displayName = a.nickname != null && !a.nickname.isBlank() ? a.nickname : a.name;
            boolean showEmail = false;
            if (userOpt.isPresent()) {
                var u = userOpt.get();
                if (u.nickname != null && !u.nickname.isBlank()) displayName = u.nickname;
                showEmail = Boolean.TRUE.equals(u.showEmail);
            }
            return ResponseEntity.ok(Map.of("artist", a, "artworks", artworks, "displayName", displayName, "showEmail", showEmail));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/artists/{id}/photo")
    public ResponseEntity<?> uploadArtistPhoto(@PathVariable Long id,
                                               @RequestHeader(value = "Authorization", required = false) String auth,
                                               @RequestParam("photo") MultipartFile photo) {
        if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
        String token = auth.substring(7);
        String email;
        try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !"artist".equalsIgnoreCase(userOpt.get().role)) return ResponseEntity.status(403).body("Not an artist");
        return artistRepository.findById(id).map(a -> {
            try {
                if (!email.equalsIgnoreCase(a.email)) return ResponseEntity.status(403).body("Not allowed");
                String absPath = imageService.saveOriginal(photo);
                String filename = java.nio.file.Paths.get(absPath).getFileName().toString();
                String url = "/api/files/" + filename;
                a.profilePhotoPath = url;
                artistRepository.save(a);
                return ResponseEntity.ok(a);
            } catch (Exception ex) { return ResponseEntity.status(500).body("Failed to save photo: " + ex.getMessage()); }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/artists/{id}/artworks")
    public ResponseEntity<?> addArtwork(@PathVariable Long id,
                                        @RequestHeader(value = "Authorization", required = false) String auth,
                                        @RequestParam(value = "title", required = false) String title,
                                        @RequestParam("image") MultipartFile image) {
        if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
        String token = auth.substring(7);
        String email;
        try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !"artist".equalsIgnoreCase(userOpt.get().role)) return ResponseEntity.status(403).body("Not an artist");
        return artistRepository.findById(id).map(a -> {
            try {
                if (!email.equalsIgnoreCase(a.email)) return ResponseEntity.status(403).body("Not allowed");
                String absPath = imageService.processAndSave(image);
                String filename = java.nio.file.Paths.get(absPath).getFileName().toString();
                String url = "/api/files/" + filename;
                com.palanas.portrait.model.Artwork art = new com.palanas.portrait.model.Artwork(id, title == null ? "" : title, url);
                artworkRepository.save(art);
                return ResponseEntity.ok(art);
            } catch (Exception ex) { return ResponseEntity.status(500).body("Failed to save artwork: " + ex.getMessage()); }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/artists/{id}/profile")
    public ResponseEntity<?> updateArtistProfile(@PathVariable Long id,
                                                 @RequestHeader(value = "Authorization", required = false) String auth,
                                                 @RequestParam(value = "nickname", required = false) String nickname,
                                                 @RequestParam(value = "bio", required = false) String bio) {
        if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
        String token = auth.substring(7);
        String email;
        try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !"artist".equalsIgnoreCase(userOpt.get().role)) return ResponseEntity.status(403).body("Not an artist");
        return artistRepository.findById(id).map(a -> {
            try {
                if (!email.equalsIgnoreCase(a.email)) return ResponseEntity.status(403).body("Not allowed");
                if (nickname != null) a.nickname = nickname;
                if (bio != null) a.bio = bio;
                artistRepository.save(a);
                // also persist bio/nickname into the User record (keep in sync)
                try {
                    var uopt = userRepository.findByEmail(a.email);
                    if (uopt.isPresent()) {
                        var u = uopt.get();
                        if (nickname != null) u.nickname = nickname;
                        if (bio != null) u.bio = bio;
                        userRepository.save(u);
                    }
                } catch (Exception ex) { /* ignore sync failures */ }
                return ResponseEntity.ok(a);
            } catch (Exception ex) { return ResponseEntity.status(500).body("Failed to update profile: " + ex.getMessage()); }
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<?> serveFile(@PathVariable String filename) {
        try {
            java.nio.file.Path p = java.nio.file.Paths.get("./backend-uploads").resolve(filename);
            if (!java.nio.file.Files.exists(p)) return ResponseEntity.notFound().build();
            org.springframework.core.io.Resource res = new org.springframework.core.io.PathResource(p);
            return ResponseEntity.ok().header("Content-Type", "image/png").body(res);
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Failed to read file: " + ex.getMessage());
        }
    }

    @GetMapping("/frames")
    public ResponseEntity<?> frames() {
        return ResponseEntity.ok(frameRepository.findAll());
    }

    @GetMapping("/artworks")
    public ResponseEntity<?> artworks() {
        try {
            var arts = artworkRepository.findAll();
            // enrich with artist name
            var enriched = arts.stream().map(a -> {
                var map = new java.util.HashMap<String,Object>();
                map.put("id", a.id);
                map.put("title", a.title);
                map.put("imagePath", a.imagePath);
                map.put("artistId", a.artistId);
                var artistOpt = artistRepository.findById(a.artistId);
                map.put("artistName", artistOpt.map(ar -> ar.nickname != null && !ar.nickname.isBlank() ? ar.nickname : ar.name).orElse("Unknown"));
                return map;
            }).toList();
            return ResponseEntity.ok(enriched);
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Failed to list artworks: " + ex.getMessage());
        }
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
            // Save the image exactly as uploaded (the preview crop) without outline processing
            String processedPath = imageService.saveOriginal(image);

            OrderEntity o = new OrderEntity();
            o.artistId = artistId;
            o.frameId = frameId;
            o.sizeLabel = size;
            o.customerName = customerName;
            o.customerEmail = customerEmail;
            o.processedImagePath = processedPath;
            try {
                String filename = java.nio.file.Paths.get(processedPath).getFileName().toString();
                o.processedImageUrl = "/api/files/" + filename;
            } catch (Exception ex) {
                // ignore - leave processedImageUrl null if we can't determine filename
            }

            // compute price based on frame basePrice and size multiplier (stored prices are in USD)
            // Convert final USD price to PHP using a fixed rate so frontend and backend match.
            // Recommended default rate: 1 USD = 40 PHP (so $10 => 400 PHP)
            final double USD_TO_PHP = 40.0;
            double price = 49.99;
            if (frameId != null) {
                Frame f = frameRepository.findById(frameId).orElse(null);
                if (f != null && f.basePrice != null) {
                    double base = f.basePrice;
                    double mult = 1.0;
                    if ("small".equalsIgnoreCase(size)) mult = 1.0;
                    else if ("medium".equalsIgnoreCase(size)) mult = 1.5;
                    else if ("large".equalsIgnoreCase(size)) mult = 2.0;
                    double usd = Math.round(base * mult * 100.0) / 100.0;
                    // convert to PHP and round to 2 decimal places
                    price = Math.round(usd * USD_TO_PHP * 100.0) / 100.0;
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

    @GetMapping("/artists/{id}/orders")
    public ResponseEntity<?> getOrdersForArtist(@PathVariable Long id) {
        try {
            // fetch all orders and filter out archived ones (treat null as not archived)
            var ordersAll = orderRepository.findByArtistId(id);
            var filtered = ordersAll.stream().filter(o -> o.archived == null || !o.archived).toList();
            return ResponseEntity.ok(filtered);
        } catch (Exception ex) { return ResponseEntity.status(500).body("Failed to fetch orders: " + ex.getMessage()); }
    }

    @GetMapping("/artists/{id}/orders/archived")
    public ResponseEntity<?> getArchivedOrdersForArtist(@PathVariable Long id) {
        try {
            // return orders where archived == true (null treated as false)
            var all = orderRepository.findByArtistId(id);
            var archived = all.stream().filter(o -> Boolean.TRUE.equals(o.archived)).toList();
            return ResponseEntity.ok(archived);
        } catch (Exception ex) { return ResponseEntity.status(500).body("Failed to fetch archived orders: " + ex.getMessage()); }
    }

    @GetMapping("/user/orders")
    public ResponseEntity<?> getOrdersForUser(@RequestHeader(value = "Authorization", required = false) String auth,
                                              @RequestParam(value = "email", required = false) String emailQuery) {
        try {
            String email = emailQuery;
            if ((email == null || email.isBlank()) && auth != null && auth.startsWith("Bearer ")) {
                String token = auth.substring(7);
                try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { /* ignore */ }
            }
            if (email == null || email.isBlank()) return ResponseEntity.badRequest().body("email required either as query or Authorization header");
            // fetch all and filter out archived (treat null as active)
            var all = orderRepository.findByCustomerEmail(email);
            var filtered = all.stream().filter(o -> o.archived == null || !o.archived).toList();
            return ResponseEntity.ok(filtered);
        } catch (Exception ex) { return ResponseEntity.status(500).body("Failed to fetch user orders: " + ex.getMessage()); }
    }

    @GetMapping("/orders/{id}/image")
    public ResponseEntity<?> getOrderImage(@PathVariable Long id) {
        return orderRepository.findById(id).map(o -> {
            try {
                String filename = null;
                // prefer processedImagePath if it points to an existing file
                try {
                    java.nio.file.Path maybe = java.nio.file.Paths.get(o.processedImagePath);
                    if (java.nio.file.Files.exists(maybe)) {
                        filename = maybe.getFileName().toString();
                    }
                } catch (Exception ex) { /* ignore */ }
                if (filename == null && o.processedImageUrl != null && o.processedImageUrl.contains("/")) {
                    filename = o.processedImageUrl.substring(o.processedImageUrl.lastIndexOf('/') + 1);
                }
                if (filename == null && o.processedImagePath != null && o.processedImagePath.contains("/api/files/")) {
                    filename = o.processedImagePath.substring(o.processedImagePath.lastIndexOf('/') + 1);
                }
                if (filename == null) return ResponseEntity.notFound().build();
                java.nio.file.Path p = java.nio.file.Paths.get("./backend-uploads").resolve(filename);
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

    @GetMapping("/orders/{id}/download")
    public ResponseEntity<?> downloadOrderImage(@PathVariable Long id) {
        return orderRepository.findById(id).map(o -> {
            try {
                String filename = null;
                try {
                    java.nio.file.Path maybe = java.nio.file.Paths.get(o.processedImagePath);
                    if (java.nio.file.Files.exists(maybe)) filename = maybe.getFileName().toString();
                } catch (Exception ex) { /* ignore */ }
                if (filename == null && o.processedImageUrl != null && o.processedImageUrl.contains("/")) {
                    filename = o.processedImageUrl.substring(o.processedImageUrl.lastIndexOf('/') + 1);
                }
                if (filename == null) return ResponseEntity.notFound().build();
                java.nio.file.Path p = java.nio.file.Paths.get("./backend-uploads").resolve(filename);
                if (!java.nio.file.Files.exists(p)) return ResponseEntity.notFound().build();
                org.springframework.core.io.Resource res = new org.springframework.core.io.PathResource(p);
                return ResponseEntity.ok()
                        .header("Content-Type", "application/octet-stream")
                        .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                        .body(res);
            } catch (Exception ex) {
                return ResponseEntity.status(500).body("Failed to prepare download: " + ex.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id,
                                               @RequestHeader(value = "Authorization", required = false) String auth,
                                               @RequestParam("status") String status) {
        if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
        String token = auth.substring(7);
        String email;
        try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid user");
        var u = userOpt.get();
        return orderRepository.findById(id).map(o -> {
            try {
                // artists can update status for their orders
                if ("artist".equalsIgnoreCase(u.role)) {
                    // verify artist owns the order
                        if (o.artistId == null) return ResponseEntity.status(403).body("Order has no artist assigned");
                    var artistOpt = artistRepository.findById(o.artistId);
                    if (artistOpt.isEmpty() || !artistOpt.get().email.equalsIgnoreCase(u.email)) return ResponseEntity.status(403).body("Not allowed");
                        // handle rejection: archive immediately
                        if ("REJECTED".equalsIgnoreCase(status)) {
                            o.status = "REJECTED";
                            o.archived = true;
                            orderRepository.save(o);
                            return ResponseEntity.ok(o);
                        }

                        // completed: mark completed and archive only if already paid
                        if ("COMPLETED".equalsIgnoreCase(status)) {
                            o.status = "COMPLETED";
                            if (Boolean.TRUE.equals(o.paid)) {
                                o.archived = true;
                            }
                            orderRepository.save(o);
                            return ResponseEntity.ok(o);
                        }

                        o.status = status;
                        if ("PAID".equalsIgnoreCase(status)) o.paid = true;
                        orderRepository.save(o);
                        return ResponseEntity.ok(o);
                }
                if ("customer".equalsIgnoreCase(u.role)) {
                    if ("PAID".equalsIgnoreCase(status)) { o.status = "PAID"; o.paid = true; orderRepository.save(o); return ResponseEntity.ok(o); }
                    return ResponseEntity.status(403).body("Customers can only set PAID status");
                }
                return ResponseEntity.status(403).body("Invalid role");
            } catch (Exception ex) { return ResponseEntity.status(500).body("Failed to update status: " + ex.getMessage()); }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/orders/{id}/progress-upload")
    public ResponseEntity<?> uploadProgressImage(@PathVariable Long id,
                                                 @RequestHeader(value = "Authorization", required = false) String auth,
                                                 @RequestParam("image") MultipartFile image) {
        if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
        String token = auth.substring(7);
        String email;
        try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !"artist".equalsIgnoreCase(userOpt.get().role)) return ResponseEntity.status(403).body("Not an artist");
        return orderRepository.findById(id).map(o -> {
            try {
                // verify ownership
                if (o.artistId == null) return ResponseEntity.status(403).body("Order has no artist assigned");
                var artistOpt = artistRepository.findById(o.artistId);
                if (artistOpt.isEmpty() || !artistOpt.get().email.equalsIgnoreCase(email)) return ResponseEntity.status(403).body("Not allowed");
                String abs = imageService.saveOriginal(image);
                String filename = java.nio.file.Paths.get(abs).getFileName().toString();
                o.progressImagePath = abs;
                o.progressImageUrl = "/api/files/" + filename;
                // set status to IN_PROGRESS if not already
                if (!"IN_PROGRESS".equalsIgnoreCase(o.status)) o.status = "IN_PROGRESS";
                orderRepository.save(o);
                return ResponseEntity.ok(o);
            } catch (Exception ex) { return ResponseEntity.status(500).body("Failed to upload progress: " + ex.getMessage()); }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/orders/{id}/pay")
    public ResponseEntity<?> payOrder(@PathVariable Long id,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
        String token = auth.substring(7);
        String email;
        try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid user");
        return orderRepository.findById(id).map(o -> {
            try {
                // only the customer who created the order can pay
                if (!email.equalsIgnoreCase(o.customerEmail)) return ResponseEntity.status(403).body("Not allowed");
                String prevStatus = o.status != null ? o.status : "";
                o.status = "PAID";
                o.paid = true;
                // if previously completed, archive after payment
                if ("COMPLETED".equalsIgnoreCase(prevStatus)) {
                    o.archived = true;
                }
                orderRepository.save(o);
                return ResponseEntity.ok(Map.of("success", true, "order", o));
            } catch (Exception ex) { return ResponseEntity.status(500).body("Failed to simulate payment: " + ex.getMessage()); }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/admin/repair-order-urls")
    public ResponseEntity<?> repairOrderUrls() {
        try {
            java.util.List<Long> updated = new java.util.ArrayList<>();
            java.util.List<com.palanas.portrait.model.OrderEntity> all = orderRepository.findAll();
            for (com.palanas.portrait.model.OrderEntity o : all) {
                try {
                    if (o.processedImageUrl == null || o.processedImageUrl.isBlank()) {
                        String filename = null;
                        if (o.processedImagePath != null && !o.processedImagePath.isBlank()) {
                            try {
                                java.nio.file.Path maybe = java.nio.file.Paths.get(o.processedImagePath);
                                if (java.nio.file.Files.exists(maybe)) filename = maybe.getFileName().toString();
                            } catch (Exception ex) { /* ignore */ }
                            if (filename == null && o.processedImagePath.contains("/api/files/")) {
                                filename = o.processedImagePath.substring(o.processedImagePath.lastIndexOf('/') + 1);
                            }
                        }
                        if (filename != null) {
                            java.nio.file.Path p = java.nio.file.Paths.get("./backend-uploads").resolve(filename);
                            if (java.nio.file.Files.exists(p)) {
                                o.processedImageUrl = "/api/files/" + filename;
                                orderRepository.save(o);
                                updated.add(o.id);
                            }
                        }
                    }
                } catch (Exception ex) {
                    // continue with others
                }
            }
            return ResponseEntity.ok(java.util.Map.of("updated", updated.size(), "ids", updated));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Failed to repair order urls: " + ex.getMessage());
        }
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(413).body("File too large. Maximum allowed upload size is 10MB.");
    }

    // user-level endpoints
    @PostMapping("/user/photo")
    public ResponseEntity<?> uploadUserPhoto(@RequestHeader(value = "Authorization", required = false) String auth,
                                             @RequestParam("photo") MultipartFile photo) {
        if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
        String token = auth.substring(7);
        String email;
        try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid user");
        try {
            String absPath = imageService.saveOriginal(photo);
            String filename = java.nio.file.Paths.get(absPath).getFileName().toString();
            String url = "/api/files/" + filename;
            var u = userOpt.get();
            u.profilePhotoPath = url;
            userRepository.save(u);
            return ResponseEntity.ok(u);
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Failed to save photo: " + ex.getMessage());
        }
    }

    @PostMapping("/user/settings")
    public ResponseEntity<?> updateUserSettings(@RequestHeader(value = "Authorization", required = false) String auth,
                                                @RequestBody Map<String,Object> body) {
        if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
        String token = auth.substring(7);
        String email;
        try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid user");
        var u = userOpt.get();
    if (body.containsKey("showEmail")) u.showEmail = Boolean.TRUE.equals(body.get("showEmail"));
    if (body.containsKey("bio")) u.bio = (String) body.get("bio");
        // password change requires oldPassword and newPassword
        if (body.containsKey("newPassword")) {
            String newPw = (String) body.get("newPassword");
            String oldPw = (String) body.getOrDefault("oldPassword", null);
            if (newPw == null || newPw.isBlank()) return ResponseEntity.badRequest().body("New password required");
            if (oldPw == null || oldPw.isBlank()) return ResponseEntity.status(400).body("Old password required to change password");
            // verify old password
            if (!passwordEncoder.matches(oldPw, u.passwordHash)) return ResponseEntity.status(403).body("Old password does not match");
            u.passwordHash = passwordEncoder.encode(newPw);
        }
        userRepository.save(u);
        // if this user is an artist, also update the Artist record to keep bio/nickname in sync
        try {
            if ("artist".equalsIgnoreCase(u.role) && u.email != null) {
                var aOpt = artistRepository.findById(u.id); // try by id first (if same id), fallback by email
                if (aOpt.isEmpty()) {
                    java.util.List<com.palanas.portrait.model.Artist> all = artistRepository.findAll();
                    for (com.palanas.portrait.model.Artist a : all) {
                        if (a.email != null && a.email.equalsIgnoreCase(u.email)) { a.bio = u.bio; a.nickname = u.nickname; artistRepository.save(a); break; }
                    }
                } else {
                    var a = aOpt.get(); a.bio = u.bio; a.nickname = u.nickname; artistRepository.save(a);
                }
            }
        } catch (Exception ex) { /* ignore sync errors */ }
        return ResponseEntity.ok(u);
    }

    @GetMapping("/user/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).body("Missing Authorization");
        String token = auth.substring(7);
        String email;
        try { var c = jwtUtil.parse(token); email = (String) c.get("sub"); } catch (Exception ex) { return ResponseEntity.status(401).body("Invalid token: " + ex.getMessage()); }
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Invalid user");
        return ResponseEntity.ok(userOpt.get());
    }
}

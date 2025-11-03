package com.palanas.portrait;

import com.palanas.portrait.model.User;
import com.palanas.portrait.model.Artist;
import com.palanas.portrait.repo.ArtistRepository;
import com.palanas.portrait.repo.UserRepository;
import com.palanas.portrait.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ArtistRepository artistRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String,String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        if (userRepository.findByEmail(email).isPresent()) return ResponseEntity.badRequest().body("User exists");
        String role = body.getOrDefault("role","customer");
        User u = new User(name, email, passwordEncoder.encode(password), role);
        // default profile photo and bio for new users
        u.profilePhotoPath = "/assets/images/default-profile.png";
        u.bio = "Hi — tell people a bit about yourself here. This is your public bio.";
    userRepository.save(u);
        // if signing up as an artist, also create an Artist record (basic)
        if ("artist".equalsIgnoreCase(role)) {
            Artist a = new Artist(name, email);
            // point to frontend asset default; frontend will use this if no uploaded photo exists
            a.profilePhotoPath = "/assets/images/default-profile.png";
            artistRepository.save(a);
        }
        String token = jwtUtil.generateToken(email, u.role);
        return ResponseEntity.ok(Map.of("token", token, "role", u.role));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String,String> body) {
        String email = body.get("email");
        String password = body.get("password");
        return userRepository.findByEmail(email).map(u -> {
            if (!passwordEncoder.matches(password, u.passwordHash)) return ResponseEntity.status(401).body("Invalid credentials");
            String token = jwtUtil.generateToken(email, u.role);
            return ResponseEntity.ok(Map.of("token", token, "role", u.role));
        }).orElse(ResponseEntity.status(401).body("Invalid credentials"));
    }
}

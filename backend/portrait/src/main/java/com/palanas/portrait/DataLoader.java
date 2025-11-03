package com.palanas.portrait;

import com.palanas.portrait.model.Artist;
import com.palanas.portrait.model.Frame;
import com.palanas.portrait.repo.ArtistRepository;
import com.palanas.portrait.repo.FrameRepository;
import com.palanas.portrait.model.User;
import com.palanas.portrait.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final ArtistRepository artistRepository;
    private final FrameRepository frameRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(ArtistRepository artistRepository, FrameRepository frameRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.artistRepository = artistRepository;
        this.frameRepository = frameRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (artistRepository.count() == 0) {
            Artist a1 = new Artist(); a1.name = "Sketchy Sam"; a1.email = "sam@example.com"; a1.profilePhotoPath = "/assets/images/default-profile.png";
            Artist a2 = new Artist(); a2.name = "Pencil Pat"; a2.email = "pat@example.com"; a2.profilePhotoPath = "/assets/images/default-profile.png";
            artistRepository.save(a1);
            artistRepository.save(a2);
        } else {
            // migrate existing artists: set profilePhotoPath to default if missing
            artistRepository.findAll().forEach(a -> {
                if (a.profilePhotoPath == null || a.profilePhotoPath.isBlank()) {
                    a.profilePhotoPath = "/assets/images/default-profile.png";
                    artistRepository.save(a);
                }
            });
        }

        if (frameRepository.count() == 0) {
            Frame f1 = new Frame(); f1.name = "Simple Black"; f1.overlayPath = "/frames/black.svg"; f1.basePrice = 10.0; f1.aspectRatio = 1.0;
            Frame f2 = new Frame(); f2.name = "Ornate Gold"; f2.overlayPath = "/frames/gold.svg"; f2.basePrice = 25.0; f2.aspectRatio = 1.0;
            frameRepository.save(f1);
            frameRepository.save(f2);
        }

        if (userRepository.count() == 0) {
            User u1 = new User("Customer One","cust@example.com", passwordEncoder.encode("password"), "customer");
            u1.bio = "Hi, I'm Customer One — this is a sample bio. Add your own about me here.";
            User u2 = new User("Artist One","artist@example.com", passwordEncoder.encode("password"), "artist");
            u2.bio = "Hi, I'm Artist One — I create portraits and sketches. Add your own about me here.";
            userRepository.save(u1);
            userRepository.save(u2);
        }
    }
}

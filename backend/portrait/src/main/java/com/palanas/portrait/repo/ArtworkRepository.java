package com.palanas.portrait.repo;

import com.palanas.portrait.model.Artwork;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArtworkRepository extends JpaRepository<Artwork, Long> {
    List<Artwork> findByArtistId(Long artistId);
}

package com.palanas.portrait.repo;

import com.palanas.portrait.model.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
	List<OrderEntity> findByArtistId(Long artistId);
	List<OrderEntity> findByArtistIdAndArchivedFalse(Long artistId);
	List<OrderEntity> findByArtistIdAndArchivedTrue(Long artistId);
	List<OrderEntity> findByCustomerEmail(String customerEmail);
	List<OrderEntity> findByCustomerEmailAndArchivedFalse(String customerEmail);
}

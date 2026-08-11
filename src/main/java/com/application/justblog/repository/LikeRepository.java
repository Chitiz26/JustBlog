package com.application.justblog.repository;

import com.application.justblog.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {

    // Like count for a post — always derived, never stored directly
    long countByBlog_BlogId(Long blogId);

    // Check if a specific user already liked a specific post (to toggle the like button)
    Optional<Like> findByUser_UserIdAndBlog_BlogId(Long userId, Long blogId);

    boolean existsByUser_UserIdAndBlog_BlogId(Long userId, Long blogId);

    void deleteByUser_UserIdAndBlog_BlogId(Long userId, Long blogId);
}
package com.application.justblog.repository;

import com.application.justblog.entity.Blog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlogRepository extends JpaRepository<Blog, Long> {

    // All blogs written by a given user (via the author_id foreign key)
    List<Blog> findByAuthor_UserId(Long userId);

    // Newest posts first — a typical home-feed query
    List<Blog> findAllByOrderByCreatedAtDesc();

    // For fetching a single post by its URL-friendly slug
    Optional<Blog> findBySlug(String slug);
}
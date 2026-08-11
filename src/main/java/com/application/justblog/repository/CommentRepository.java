package com.application.justblog.repository;

import com.application.justblog.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // All comments under a given blog post, oldest first
    List<Comment> findByBlog_BlogIdOrderByCreatedAtAsc(Long blogId);

    // All comments a specific user has written, across all posts
    List<Comment> findByUser_UserId(Long userId);
}
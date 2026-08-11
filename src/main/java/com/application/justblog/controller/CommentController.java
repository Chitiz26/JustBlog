package com.application.justblog.controller;

import com.application.justblog.entity.Comment;
import com.application.justblog.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // e.g. POST /api/comments/user/3/blog/7
    @PostMapping("/user/{userId}/blog/{blogId}")
    public ResponseEntity<Comment> addComment(
            @PathVariable Long userId,
            @PathVariable Long blogId,
            @RequestBody Comment comment
    ) {
        Comment created = commentService.addComment(userId, blogId, comment);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/blog/{blogId}")
    public ResponseEntity<List<Comment>> getCommentsForBlog(@PathVariable Long blogId) {
        return ResponseEntity.ok(commentService.getCommentsForBlog(blogId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Comment>> getCommentsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(commentService.getCommentsByUser(userId));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
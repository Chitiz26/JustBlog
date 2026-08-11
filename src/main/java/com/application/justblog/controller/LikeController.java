package com.application.justblog.controller;

import com.application.justblog.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    // e.g. POST /api/likes/user/3/blog/7  -> toggles like/unlike
    @PostMapping("/user/{userId}/blog/{blogId}")
    public ResponseEntity<String> toggleLike(@PathVariable Long userId, @PathVariable Long blogId) {
        boolean nowLiked = likeService.toggleLike(userId, blogId);
        String message = nowLiked ? "Blog liked" : "Blog unliked";
        return ResponseEntity.ok(message);
    }

    @GetMapping("/blog/{blogId}/count")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long blogId) {
        return ResponseEntity.ok(likeService.getLikeCount(blogId));
    }

    @GetMapping("/user/{userId}/blog/{blogId}/status")
    public ResponseEntity<Boolean> hasUserLiked(@PathVariable Long userId, @PathVariable Long blogId) {
        return ResponseEntity.ok(likeService.hasUserLiked(userId, blogId));
    }
}
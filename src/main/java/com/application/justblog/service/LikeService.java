package com.application.justblog.service;

import com.application.justblog.entity.Blog;
import com.application.justblog.entity.Like;
import com.application.justblog.entity.User;
import com.application.justblog.repository.LikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final UserService userService;
    private final BlogService blogService;

    /**
     * Toggles a like: if the user already liked this blog, remove the like (unlike).
     * If they haven't, add one. This is what a single "like button" click should call.
     */
    public boolean toggleLike(Long userId, Long blogId) {
        boolean alreadyLiked = likeRepository.existsByUser_UserIdAndBlog_BlogId(userId, blogId);

        if (alreadyLiked) {
            likeRepository.deleteByUser_UserIdAndBlog_BlogId(userId, blogId);
            return false;   // now unliked
        }

        User user = userService.getUserById(userId);
        Blog blog = blogService.getBlogById(blogId);

        Like like = new Like();
        like.setUser(user);
        like.setBlog(blog);
        likeRepository.save(like);
        return true;   // now liked
    }

    public long getLikeCount(Long blogId) {
        return likeRepository.countByBlog_BlogId(blogId);
    }

    public boolean hasUserLiked(Long userId, Long blogId) {
        return likeRepository.existsByUser_UserIdAndBlog_BlogId(userId, blogId);
    }
}
package com.application.justblog.service;

import com.application.justblog.entity.Blog;
import com.application.justblog.entity.Comment;
import com.application.justblog.entity.User;
import com.application.justblog.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserService userService;
    private final BlogService blogService;

    public Comment addComment(Long userId, Long blogId, Comment comment) {
        User user = userService.getUserById(userId);
        Blog blog = blogService.getBlogById(blogId);

        comment.setUser(user);
        comment.setBlog(blog);
        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsForBlog(Long blogId) {
        return commentRepository.findByBlog_BlogIdOrderByCreatedAtAsc(blogId);
    }

    public List<Comment> getCommentsByUser(Long userId) {
        return commentRepository.findByUser_UserId(userId);
    }

    public void deleteComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new RuntimeException("Comment not found with id: " + commentId);
        }
        commentRepository.deleteById(commentId);
    }
}
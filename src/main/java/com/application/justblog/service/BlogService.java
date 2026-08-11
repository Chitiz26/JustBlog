package com.application.justblog.service;

import com.application.justblog.entity.Blog;
import com.application.justblog.entity.User;
import com.application.justblog.repository.BlogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BlogService {

    private final BlogRepository blogRepository;
    private final UserService userService;   // used to confirm the author actually exists

    public Blog createBlog(Long authorId, Blog blog) {
        User author = userService.getUserById(authorId);
        blog.setAuthor(author);
        return blogRepository.save(blog);
    }

    public List<Blog> getAllBlogs() {
        return blogRepository.findAllByOrderByCreatedAtDesc();
    }

    public Blog getBlogById(Long blogId) {
        return blogRepository.findById(blogId)
                .orElseThrow(() -> new RuntimeException("Blog not found with id: " + blogId));
    }

    public List<Blog> getBlogsByAuthor(Long authorId) {
        return blogRepository.findByAuthor_UserId(authorId);
    }

    public Blog updateBlog(Long blogId, Blog updatedBlog) {
        Blog existing = getBlogById(blogId);
        existing.setTitle(updatedBlog.getTitle());
        existing.setContent(updatedBlog.getContent());
        existing.setSlug(updatedBlog.getSlug());
        return blogRepository.save(existing);
    }

    public void deleteBlog(Long blogId) {
        if (!blogRepository.existsById(blogId)) {
            throw new RuntimeException("Blog not found with id: " + blogId);
        }
        blogRepository.deleteById(blogId);   // cascades to its likes and comments
    }
}
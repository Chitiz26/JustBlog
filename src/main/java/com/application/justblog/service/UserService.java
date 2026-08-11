package com.application.justblog.service;

import com.application.justblog.entity.User;
import com.application.justblog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor   // Lombok: generates a constructor for all final fields -> Spring injects UserRepository automatically
public class UserService {

    private final UserRepository userRepository;

    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        // TODO: once Spring Security is added, hash the password here before saving:
        // user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    public User updateUser(Long userId, User updatedUser) {
        User existing = getUserById(userId);
        existing.setBio(updatedUser.getBio());
        existing.setProfilePicUrl(updatedUser.getProfilePicUrl());
        // username/email/password intentionally not updated here — handle those as separate,
        // more guarded operations later (e.g. change-password flow with old-password check)
        return userRepository.save(existing);
    }

    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);   // cascades to their blogs, likes, comments
    }
}
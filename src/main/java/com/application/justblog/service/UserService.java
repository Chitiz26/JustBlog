package com.application.justblog.service;

import com.application.justblog.entity.User;
import com.application.justblog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor   // Lombok: generates a constructor for all final fields -> Spring injects UserRepository automatically
public class UserService {

    private final UserRepository userRepository;

    // Folder (on disk) where profile pictures are stored — see app.upload.dir in application.properties
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/png", "image/jpeg", "image/webp", "image/gif");
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;   // 5MB
    private static final String AVATAR_URL_PREFIX = "/uploads/avatars/";

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
        // Only overwrite the picture if one was actually sent. Without this check, saving just the
        // bio (which sends no profilePicUrl) would wipe the user's uploaded picture.
        if (updatedUser.getProfilePicUrl() != null) {
            existing.setProfilePicUrl(updatedUser.getProfilePicUrl());
        }
        // username/email/password intentionally not updated here — handle those as separate,
        // more guarded operations later (e.g. change-password flow with old-password check)
        return userRepository.save(existing);
    }

    // Saves an uploaded image and points the user's profilePicUrl at it.
    public User updateProfilePicture(Long userId, MultipartFile file) {
        User user = getUserById(userId);

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file was uploaded");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be smaller than 5MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PNG, JPG, WEBP or GIF images are allowed");
        }

        // We choose the extension ourselves from the content type — never trust the uploaded file name.
        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };

        try {
            Path avatarsDir = avatarsDirectory();
            Files.createDirectories(avatarsDir);

            String filename = "user-" + userId + "-" + UUID.randomUUID() + extension;
            try (var in = file.getInputStream()) {
                Files.copy(in, avatarsDir.resolve(filename));
            }

            deleteOldAvatar(user.getProfilePicUrl());   // don't leave orphaned files behind
            user.setProfilePicUrl(AVATAR_URL_PREFIX + filename);
            return userRepository.save(user);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store profile picture", e);
        }
    }

    private Path avatarsDirectory() {
        return Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();
    }

    // Removes the previous picture file, but only if it really is one of ours inside the avatars folder.
    private void deleteOldAvatar(String oldUrl) {
        if (oldUrl == null || !oldUrl.startsWith(AVATAR_URL_PREFIX)) return;
        try {
            Path avatarsDir = avatarsDirectory();
            Path old = avatarsDir.resolve(oldUrl.substring(AVATAR_URL_PREFIX.length())).normalize();
            if (old.startsWith(avatarsDir)) {   // blocks "../" tricks
                Files.deleteIfExists(old);
            }
        } catch (IOException | RuntimeException ignored) {
            // failing to clean up an old file must never fail the upload itself
        }
    }

    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);   // cascades to their blogs, likes, comments
    }
}
package com.application.justblog.controller;

import com.application.justblog.dto.AuthResponse;
import com.application.justblog.dto.LoginRequest;
import com.application.justblog.entity.User;
import com.application.justblog.repository.UserRepository;
import com.application.justblog.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    // Replaces the old POST /api/users for account creation — this version hashes the password.
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));// hash before saving
        user.setRole(User.Role.USER);
        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, saved.getUserId(), saved.getUsername()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        // This line does the actual password check, using CustomUserDetailsService +
        // PasswordEncoder behind the scenes. Throws an exception automatically if it fails.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, user.getUserId(), user.getUsername()));
    }
}
package com.application.justblog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.List;

@Entity
@Table(name = "users")
@Data                 // Lombok: generates getters, setters, toString, equals, hashCode
@NoArgsConstructor     // JPA requires a no-arg constructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;   // store BCrypt hash only, never plaintext

    @Column(length = 500)
    private String bio;

    @Column(name = "profile_pic_url", length = 255)
    private String profilePicUrl;

    @Enumerated(EnumType.STRING)   // stores "USER"/"ADMIN" as text, not 0/1
    @Column(nullable = false)
    private Role role = Role.USER;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Timestamp createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private Timestamp updatedAt;

    // ---- Relationships (not actual DB columns, just for navigation in Java) ----

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Blog> blogs;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Like> likes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Comment> comments;

    public enum Role {
        USER, ADMIN
    }
}
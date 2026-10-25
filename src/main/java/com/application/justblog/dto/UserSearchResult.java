package com.application.justblog.dto;

// What the search endpoint returns for each match. Deliberately NOT the User entity:
// the entity carries the password hash and email, which must never be sent to other users.
public record UserSearchResult(Long userId, String username, String bio) {
}
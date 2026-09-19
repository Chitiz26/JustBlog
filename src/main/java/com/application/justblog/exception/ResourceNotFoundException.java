package com.application.justblog.exception;

// Thrown when a lookup by ID (user, blog, comment, like) finds nothing.
// Replaces generic RuntimeException so callers can catch this specifically
// and the GlobalExceptionHandler can map it to a proper 404 response.
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
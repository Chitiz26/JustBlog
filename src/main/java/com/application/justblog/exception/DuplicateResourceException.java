package com.application.justblog.exception;

// Thrown when trying to create a user with a username/email that already exists.
// Replaces generic IllegalArgumentException for the same precision reason.
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
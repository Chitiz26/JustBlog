package com.application.justblog.dto;

import lombok.Data; //lombok

@Data
public class LoginRequest {
    private String username;
    private String password;
}

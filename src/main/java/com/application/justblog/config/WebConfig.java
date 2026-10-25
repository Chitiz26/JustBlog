package com.application.justblog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

// Serves uploaded profile pictures at  http://localhost:8080/uploads/avatars/<file>
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Same property UserService uses to decide where uploads are written.
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Uploads go to a real folder on disk (not src/main/resources, which is read-only
        // once the app is packaged as a jar), so map the URL path straight to that folder.
        String location = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }
}
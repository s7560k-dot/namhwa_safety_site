package com.namhwa.safety;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@SpringBootApplication
@RestController
public class SafetyApplication {

	public static void main(String[] args) {
		SpringApplication.run(SafetyApplication.class, args);
	}

	@GetMapping("/api/status")
	public Map<String, String> status() {
		return Map.of("status", "running", "message", "Backend is active");
	}

}

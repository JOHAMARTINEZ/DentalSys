package cl.dentalsys;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "ok",
                "application", "DentalSys Backend"
        );
    }

    @GetMapping("/api/authenticated")
    public Map<String, String> authenticated() {
        return Map.of(
                "status", "authenticated",
                "message", "JWT válido"
        );
    }
}
package cl.dentalsys.controller;

import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.UsuarioRepository;
import cl.dentalsys.security.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5175"
})
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UsuarioRepository usuarioRepository) {

        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> request) {

        String identificador = request.get("identificador");
        String password = request.get("password");

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                identificador,
                                password
                        )
                );

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        String token = jwtService.generateToken(userDetails);

        String rol = userDetails.getAuthorities()
                .stream()
                .findFirst()
                .map(authority ->
                        authority.getAuthority()
                                .replace("ROLE_", "")
                )
                .orElse("");

        Usuario usuario = usuarioRepository
                .findByUsername(userDetails.getUsername())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Usuario autenticado no encontrado"
                        )
                );

        Map<String, Object> respuesta = new HashMap<>();

        respuesta.put("token", token);
        respuesta.put("username", usuario.getUsername());
        respuesta.put("rol", rol);
        respuesta.put("idUsuario", usuario.getIdUsuario());
        respuesta.put("correo", usuario.getCorreo());
        respuesta.put("rut", usuario.getRut());
        respuesta.put("nombres", usuario.getNombres());
        respuesta.put("apellidos", usuario.getApellidos());

        return ResponseEntity.ok(respuesta);
    }
}
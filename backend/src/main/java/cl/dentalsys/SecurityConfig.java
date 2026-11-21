package cl.dentalsys;

import cl.dentalsys.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    // Roles de gestión (personal de la clínica)
    private static final String[] ROLES_GESTION = {
            "ADMIN",
            "RECEPCIONISTA",
            "ODONTOLOGO"
    };

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5175",
                "http://localhost:5174"
        ));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type"
        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // Sin sesión (o token vencido) -> 401.
                // Con sesión pero sin el rol necesario -> 403.
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // ===== Público (sin sesión) =====
                        .requestMatchers(
                                "/api/health",
                                "/api/auth/login",
                                "/api/odontologos",
                                "/api/sucursales",
                                "/api/motivos-cita",
                                "/api/citas/reserva-publica",
                                "/error"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // ===== Portal del paciente =====
                        .requestMatchers(
                                "/api/citas/mis-citas",
                                "/api/citas/reservar"
                        ).hasRole("PACIENTE")

                        // ===== Administración =====
                        .requestMatchers(
                                "/api/usuarios",
                                "/api/usuarios/**"
                        ).hasRole("ADMIN")

                        // ===== Gestión de la clínica =====
                        .requestMatchers(
                                "/api/dashboard/**",
                                "/api/pacientes",
                                "/api/pacientes/**",
                                "/api/citas",
                                "/api/citas/**"
                        ).hasAnyRole(ROLES_GESTION)

                        // Cualquier otro endpoint: solo con sesión
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}

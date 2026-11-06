package cl.dentalsys.service;

import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.UsuarioRepository;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(
            UsuarioRepository usuarioRepository) {

        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(
            String identificador)
            throws UsernameNotFoundException {

        Usuario usuario = buscarUsuario(identificador);

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPasswordHash())
                .roles(usuario.getRol().name())
                .disabled(usuario.getEstado() == 0)
                .build();
    }

    private Usuario buscarUsuario(String identificador) {

        return usuarioRepository
                .findByUsername(identificador)
                .or(() ->
                    usuarioRepository.findByCorreo(identificador)
                )
                .or(() ->
                    usuarioRepository.findByRut(identificador)
                )
                .orElseThrow(() ->
                    new UsernameNotFoundException(
                        "Usuario no encontrado"
                    )
                );
    }
}
package cl.dentalsys.util;

public final class RutValidator {

    private RutValidator() {
    }

    public static boolean esValido(String rut) {

        if (rut == null || rut.isBlank()) {
            return false;
        }

        String rutLimpio = rut
                .replace(".", "")
                .replace("-", "")
                .replace(" ", "")
                .toUpperCase();

        if (rutLimpio.length() < 2) {
            return false;
        }

        String cuerpo = rutLimpio.substring(0, rutLimpio.length() - 1);
        char digitoVerificador = rutLimpio.charAt(rutLimpio.length() - 1);

        if (!cuerpo.matches("\\d+")) {
            return false;
        }

        if (!(Character.isDigit(digitoVerificador)
                || digitoVerificador == 'K')) {
            return false;
        }

        int suma = 0;
        int multiplicador = 2;

        for (int i = cuerpo.length() - 1; i >= 0; i--) {

            suma += Character.getNumericValue(cuerpo.charAt(i))
                    * multiplicador;

            multiplicador++;

            if (multiplicador > 7) {
                multiplicador = 2;
            }
        }

        int resto = 11 - (suma % 11);

        char verificadorEsperado;

        if (resto == 11) {
            verificadorEsperado = '0';
        } else if (resto == 10) {
            verificadorEsperado = 'K';
        } else {
            verificadorEsperado = (char) ('0' + resto);
        }

        return digitoVerificador == verificadorEsperado;
    }

    public static String normalizar(String rut) {

        if (rut == null) {
            return null;
        }

        return rut
                .replace(".", "")
                .replace("-", "")
                .replace(" ", "")
                .toUpperCase();
    }

    public static String formatear(String rut) {

        String rutLimpio = normalizar(rut);

        if (rutLimpio == null || rutLimpio.length() < 2) {
            return rut;
        }

        String cuerpo = rutLimpio.substring(0, rutLimpio.length() - 1);
        String verificador = rutLimpio.substring(rutLimpio.length() - 1);

        StringBuilder cuerpoFormateado = new StringBuilder();

        for (int i = 0; i < cuerpo.length(); i++) {

            if (i > 0 && (cuerpo.length() - i) % 3 == 0) {
                cuerpoFormateado.append(".");
            }

            cuerpoFormateado.append(cuerpo.charAt(i));
        }

        return cuerpoFormateado + "-" + verificador;
    }
}
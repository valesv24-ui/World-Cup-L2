import { defineConfig } from 'vite';

// Configuración mínima de Vite para el proyecto.
// Se sirve todo como módulos ES nativos en desarrollo (Tema 5-6, Clase #11 Parte 2).
//
// El proxy de abajo existe porque la API pública (https://worldcup26.ir) no
// siempre manda el encabezado Access-Control-Allow-Origin en sus respuestas
// reales (aunque sí responde bien al preflight OPTIONS). Cuando eso pasa,
// el navegador bloquea la respuesta como "CORS error" sin importar qué
// tan bien esté escrito nuestro fetch(). La solución es que el navegador
// nunca cruce de origen: le habla a localhost (mismo origen), y es Vite
// —un proceso de Node, no un navegador— quien reenvía la petición a la API
// real. CORS es una restricción que solo aplican los navegadores, así que
// ese segundo salto (Vite → worldcup26.ir) no la sufre.

/**
 * Inyección de fallos SOLO para desarrollo (nunca se empaqueta en un build
 * de producción, porque vite.config.js no forma parte del bundle). No es un
 * botón dentro de la app: se dispara agregando "?__force=401" (o 429 / 500)
 * a cualquier petición hacia /wc26-api, típicamente desde la pestaña
 * Console de DevTools. Como el middleware corre en el servidor de Vite
 * ANTES de reenviar nada a la API real, el navegador recibe una respuesta
 * HTTP genuina con ese código de estado (visible en Network), sin que el
 * JavaScript de la app finja nada por dentro.
 */
function faultInjectionPlugin() {
  const FORCEABLE_STATUSES = new Set([401, 429, 500]);
  const MESSAGES = {
    401: 'Fallo inyectado a propósito (401) desde el proxy de desarrollo, para practicar el modal de sesión expirada.',
    429: 'Fallo inyectado a propósito (429) desde el proxy de desarrollo, para practicar el backoff exponencial.',
    500: 'Fallo inyectado a propósito (500) desde el proxy de desarrollo, para practicar el backoff exponencial.',
  };

  return {
    name: 'wc26-fault-injection',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/wc26-api')) {
          next();
          return;
        }

        const url = new URL(req.url, 'http://localhost');
        const forced = Number(url.searchParams.get('__force'));

        if (!FORCEABLE_STATUSES.has(forced)) {
          next();
          return;
        }

        res.statusCode = forced;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: MESSAGES[forced] }));
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [faultInjectionPlugin()],
  server: {
    proxy: {
      '/wc26-api': {
        target: 'https://worldcup26.ir',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/wc26-api/, ''),
      },
    },
  },
});

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
export default defineConfig({
  base: './',
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

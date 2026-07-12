// src/components/staleBadge.js
//
// Indicador visual reutilizable de "datos no actualizados", exigido por el
// modo offline (sección 1.5): cuando una petición falla pero hay copia en
// localStorage, se muestran los datos junto con esta insignia.

export function staleBadgeHtml(cachedAt) {
  if (!cachedAt) return '';
  const when = new Date(cachedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
  return `<span class="badge badge--stale" title="Mostrando la última copia guardada localmente">
    ⚠ Datos no actualizados (caché de ${when})
  </span>`;
}

import { useSyncExternalStore } from 'react';

const CLAVE_TEMA = 'quova.tema';
const oyentes = new Set<() => void>();

function leer(): boolean {
  try {
    return localStorage.getItem(CLAVE_TEMA) === 'oscuro';
  } catch {
    return false;
  }
}

let oscuro = leer();

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

function alternar() {
  oscuro = !oscuro;
  try {
    localStorage.setItem(CLAVE_TEMA, oscuro ? 'oscuro' : 'claro');
  } catch {
    // Sin almacenamiento, la preferencia dura solo esta visita
  }
  oyentes.forEach((oyente) => oyente());
}

const GRAFICO_OSCURO = { rejilla: '#29355A', eje: '#98A6C2', valor: '#E2E8F0', cursor: 'rgba(255,255,255,0.06)', superficie: '#121A34', borde: '#29355A', texto: '#F1F5F9' };
const GRAFICO_CLARO = { rejilla: '#E2E8F0', eje: '#64748B', valor: '#334155', cursor: '#F1F5F9', superficie: '#FFFFFF', borde: '#E2E8F0', texto: '#0F172A' };

/** Colores de los gráficos según el tema. Recharts pinta con atributos SVG, que no leen variables CSS. */
export function useColoresGrafico() {
  const { oscuro } = useTema();
  const grafico = oscuro ? GRAFICO_OSCURO : GRAFICO_CLARO;
  const estiloTooltip = {
    contentStyle: { background: grafico.superficie, border: `1px solid ${grafico.borde}`, borderRadius: 8, fontSize: 12 },
    labelStyle: { color: grafico.texto, fontWeight: 600 },
    itemStyle: { color: grafico.texto },
  };
  return { grafico, estiloTooltip };
}

/** Tema del panel interno. La preferencia se recuerda en el navegador; el login y el portal no cambian. */
export function useTema() {
  return { oscuro: useSyncExternalStore(suscribir, () => oscuro), alternar };
}

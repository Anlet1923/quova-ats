// Verificación de extremo a extremo del avance 40 % (Fase 4).
// Requiere el backend en http://localhost:8080 y el frontend en http://localhost:5173, con la BD recién creada.
// Uso: npm run verificar   (desde la carpeta frontend)
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:8080';
const CLAVE = 'Quova2026!';
const CAPTURAS = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/capturas');

mkdirSync(CAPTURAS, { recursive: true });
for (const archivo of readdirSync(CAPTURAS)) {
  if (archivo.endsWith('.png')) rmSync(resolve(CAPTURAS, archivo));
}

// Los 4xx son respuestas esperadas de las validaciones (el navegador las registra como error de recurso)
const ESPERADO = /Failed to load resource: the server responded with a status of (400|401|403|409|410|413|423)/;
const problemas = [];
let tolerarFallaDeRed = false;
let numero = 0;
const lista = [];

function vigilar(pagina, nombre) {
  pagina.on('console', (m) => {
    if (m.type() !== 'error') return;
    const texto = m.text();
    if (ESPERADO.test(texto)) return;
    if (tolerarFallaDeRed && /ERR_FAILED/.test(texto)) return;
    problemas.push(`[consola · ${nombre}] ${texto}`);
  });
  pagina.on('pageerror', (e) => problemas.push(`[excepción · ${nombre}] ${e.message}`));
  pagina.on('requestfailed', (r) => {
    if (tolerarFallaDeRed || r.failure()?.errorText === 'net::ERR_ABORTED') return;
    problemas.push(`[red · ${nombre}] ${r.method()} ${r.url()} ${r.failure()?.errorText}`);
  });
  pagina.on('response', (r) => {
    if (r.status() >= 500 || r.status() === 404) problemas.push(`[red · ${nombre}] ${r.status()} ${r.url()}`);
  });
}

async function captura(pagina, nombre, completa = false) {
  numero += 1;
  const archivo = `${String(numero).padStart(2, '0')}-${nombre}.png`;
  await pagina.waitForTimeout(350);
  await pagina.screenshot({ path: resolve(CAPTURAS, archivo), fullPage: completa });
  lista.push(archivo);
  console.log(`  captura ${archivo}`);
}

function comprobar(condicion, mensaje) {
  if (!condicion) throw new Error(`Comprobación fallida: ${mensaje}`);
  console.log(`  ok: ${mensaje}`);
}

async function iniciarSesion(pagina, correo, password = CLAVE) {
  await pagina.goto(`${BASE}/login`);
  await pagina.fill('#correo', correo);
  await pagina.fill('#password', password);
  await pagina.getByRole('button', { name: 'Iniciar sesión' }).click();
}

const tarjeta = (pagina, nombre) => pagina.locator('[data-testid^="candidato-"]', { hasText: nombre });
const enColumna = (pagina, etapa, nombre) => pagina.getByTestId(`columna-${etapa}`).locator('[data-testid^="candidato-"]', { hasText: nombre });

/** Completa los pasos 1 a 3 del portal y deja al candidato en el paso 4. */
async function llenarHastaPaso4(pagina, { nombre, dni, celular }) {
  await pagina.getByLabel('Nombre completo').fill(nombre);
  await pagina.getByLabel('DNI (8 dígitos)').fill(dni);
  await pagina.getByLabel('Celular (9 dígitos)').fill(celular);
  await pagina.getByLabel('Distrito de residencia').selectOption('Surquillo');
  await pagina.getByRole('button', { name: 'Siguiente' }).click();
  await pagina.getByRole('heading', { name: 'Disponibilidad' }).waitFor();
  await pagina.getByRole('radio', { name: 'De inmediato' }).click();
  await pagina.getByRole('checkbox', { name: /Tarde/ }).click();
  await pagina.getByRole('radio', { name: 'No', exact: true }).click();
  await pagina.getByRole('button', { name: 'Siguiente' }).click();
  await pagina.getByRole('heading', { name: 'Cuestionario rápido' }).waitFor();
  await pagina.getByLabel(/Por qué te interesa/).fill('Me gusta la moda y quiero aprender de ventas en una cadena grande.');
  await pagina.getByLabel(/mucha gente/).fill('Saludo a todos, atiendo por orden de llegada y pido apoyo si hace falta.');
  await pagina.getByRole('radio', { name: 'Sí, otros locales' }).click();
  await pagina.getByRole('button', { name: 'Siguiente' }).click();
  await pagina.getByRole('heading', { name: 'CV y envío' }).waitFor();
}

const navegador = await chromium.launch();
const escritorio = await navegador.newContext({ viewport: { width: 1440, height: 960 }, locale: 'es-PE' });
await escritorio.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const movil = await navegador.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-PE' });

const panel = await escritorio.newPage();
vigilar(panel, 'panel');
const celular = await movil.newPage();
vigilar(celular, 'portal');

try {
  // ---------- A. Login y dashboard ----------
  console.log('A. Login y dashboard');
  await panel.goto(`${BASE}/login`);
  await panel.getByRole('heading', { name: 'Bienvenido' }).waitFor();
  await captura(panel, 'login');

  await iniciarSesion(panel, 'reclutador@quova.pe');
  await panel.waitForURL('**/dashboard');
  await panel.getByTestId('grafico-etapas').locator('svg').first().waitFor();
  await panel.getByTestId('grafico-tiendas').locator('svg').first().waitFor();
  comprobar((await panel.getByTestId('usuario-nombre').innerText()) === 'Carla Mendoza', 'el menú muestra al usuario conectado');
  const abandono = panel.getByTestId('tarjeta-tasaAbandono');
  comprobar((await abandono.innerText()).includes('Favorable'), 'la baja de la tasa de abandono se marca como favorable');
  await captura(panel, 'dashboard');

  // ---------- C. Vacantes ----------
  console.log('C. Vacantes');
  await panel.getByRole('link', { name: /^Vacantes/ }).click();
  await panel.getByTestId('contador-vacantes').getByText('9 vacantes encontradas').waitFor();
  await captura(panel, 'vacantes-listado');

  await panel.getByLabel('Buscar por cargo o tienda').fill('zapatero');
  await panel.getByTestId('estado-vacio').waitFor();
  await captura(panel, 'vacantes-estado-vacio');
  await panel.getByTestId('estado-vacio').getByRole('button', { name: 'Limpiar filtros' }).click();
  await panel.getByTestId('contador-vacantes').getByText('9 vacantes encontradas').waitFor();

  await panel.getByLabel('Filtrar por estado').selectOption('ABIERTA');
  await panel.getByLabel('Filtrar por tienda').selectOption({ label: 'Miraflores' });
  await panel.getByTestId('contador-vacantes').getByText('2 vacantes encontradas').waitFor();
  await captura(panel, 'vacantes-filtros');

  await panel.getByRole('link', { name: 'Nueva vacante' }).click();
  await panel.getByRole('button', { name: /^Cajero\/a/ }).waitFor();
  await captura(panel, 'nueva-vacante-paso1-cargo');

  await panel.getByRole('button', { name: /^Cajero\/a/ }).click();
  await panel.getByRole('button', { name: 'Continuar a la vista previa' }).click();
  await panel.getByText('Elige la tienda de la vacante.').waitFor();
  await panel.getByText('Elige el turno.').waitFor();
  await captura(panel, 'nueva-vacante-paso2-validacion');

  comprobar((await panel.getByLabel('Salario mensual (S/)').inputValue()) === '1200', 'la plantilla precarga el salario base del cargo');
  comprobar(await panel.getByLabel('Tienda').locator('option', { hasText: 'San Borja' }).isDisabled(), 'la tienda inactiva no se puede elegir');
  await panel.getByLabel('Tienda').selectOption({ label: 'Surco' });
  await panel.getByRole('button', { name: /^Tarde/ }).click();
  await panel.getByLabel('Número de puestos').fill('2');
  await captura(panel, 'nueva-vacante-paso2-completo');

  await panel.getByRole('button', { name: 'Continuar a la vista previa' }).click();
  await panel.getByTestId('vista-previa').waitFor();
  await captura(panel, 'nueva-vacante-paso3-vista-previa');

  await panel.getByRole('button', { name: 'Publicar', exact: true }).click();
  await panel.getByTestId('vacante-publicada').waitFor();
  const link = await panel.getByTestId('link-vacante').inputValue();
  await panel.getByRole('button', { name: 'Copiar link' }).click();
  await panel.getByRole('button', { name: 'Link copiado' }).waitFor();
  comprobar((await panel.evaluate(() => navigator.clipboard.readText())) === link, `el link copiado es ${link}`);
  await captura(panel, 'vacante-publicada-copiar-link');

  // Vacante duplicada (misma tienda, cargo y turno)
  await panel.getByRole('link', { name: 'Nueva vacante' }).click();
  await panel.getByRole('button', { name: /^Cajero\/a/ }).click();
  await panel.getByLabel('Tienda').selectOption({ label: 'Surco' });
  await panel.getByRole('button', { name: /^Tarde/ }).click();
  await panel.getByRole('button', { name: 'Continuar a la vista previa' }).click();
  await panel.getByRole('button', { name: 'Publicar', exact: true }).click();
  await panel.getByRole('dialog', { name: 'Ya existe una vacante igual' }).waitFor();
  comprobar(await panel.getByRole('button', { name: 'Crear igualmente' }).isVisible(), 'el aviso ofrece «Crear igualmente»');
  await captura(panel, 'vacante-duplicada-aviso');
  await panel.getByRole('button', { name: 'Ver existente' }).click();
  await panel.getByTestId('contador-vacantes').getByText('1 vacante encontrada').waitFor();
  await captura(panel, 'vacante-existente');

  // ---------- B. Portal de postulación (móvil 375 × 812) ----------
  console.log('B. Portal de postulación');
  await celular.goto(`${link}?fuente=linkedin`);
  await celular.getByTestId('tarjeta-vacante').getByText('Cajero/a').waitFor();
  comprobar((await celular.getByTestId('indicador-paso').innerText()).toUpperCase() === 'PASO 1 DE 4', 'el indicador muestra el paso 1 de 4');
  await captura(celular, 'portal-paso1-datos', true);

  await celular.getByLabel('Nombre completo').fill('Ana');
  await celular.getByLabel('DNI (8 dígitos)').fill('1234');
  await celular.getByLabel('Celular (9 dígitos)').fill('812345678');
  await celular.getByLabel(/Correo electrónico/).fill('ana@');
  await celular.getByRole('button', { name: 'Siguiente' }).click();
  await celular.getByText('El DNI debe tener 8 dígitos numéricos.').waitFor();
  await celular.getByText('Ingresa un celular de 9 dígitos que empiece con 9.').waitFor();
  await celular.getByText('Revisa el formato del correo').waitFor();
  comprobar((await celular.getByLabel('Nombre completo').inputValue()) === 'Ana', 'los datos escritos se conservan tras el error');
  await captura(celular, 'portal-dni-invalido', true);

  await celular.getByLabel('Nombre completo').fill('Valentina Cruz Huertas');
  await celular.getByLabel('DNI (8 dígitos)').fill('76543210');
  await celular.getByLabel('Celular (9 dígitos)').fill('987654321');
  await celular.getByLabel(/Correo electrónico/).fill('');
  await celular.getByLabel('Distrito de residencia').selectOption('Surquillo');
  await celular.getByRole('button', { name: 'Siguiente' }).click();
  await celular.getByRole('heading', { name: 'Disponibilidad' }).waitFor();

  await celular.getByRole('button', { name: 'Siguiente' }).click();
  await celular.getByText('Elige al menos un turno.').waitFor();
  await celular.getByRole('radio', { name: 'En 1 semana' }).click();
  await celular.getByRole('checkbox', { name: /Tarde/ }).click();
  await celular.getByRole('checkbox', { name: /Fines de semana/ }).click();
  comprobar(!(await celular.getByTestId('tiempo-experiencia').isVisible()), 'el tiempo de experiencia no se pregunta todavía');
  await celular.getByRole('radio', { name: 'No', exact: true }).click();
  comprobar(!(await celular.getByTestId('tiempo-experiencia').isVisible()), 'con «No» el tiempo de experiencia sigue oculto');
  await celular.getByRole('radio', { name: 'Sí', exact: true }).click();
  await celular.getByTestId('tiempo-experiencia').waitFor();
  await celular.getByRole('radio', { name: '6 meses a 1 año' }).click();
  await captura(celular, 'portal-paso2-disponibilidad', true);
  await celular.getByRole('button', { name: 'Siguiente' }).click();
  await celular.getByRole('heading', { name: 'Cuestionario rápido' }).waitFor();

  await celular.getByLabel(/Por qué te interesa/).fill('Por la moda');
  await celular.getByRole('button', { name: 'Siguiente' }).click();
  await celular.getByText('Cuéntanos un poco más (mínimo 20 caracteres).').first().waitFor();
  await captura(celular, 'portal-paso3-validacion', true);
  await celular.getByLabel(/Por qué te interesa/).fill('Me gusta la moda y quiero crecer en una cadena con varias tiendas.');
  await celular.getByLabel(/mucha gente/).fill('Mantengo la calma, saludo a cada cliente y atiendo por orden de llegada.');
  await celular.getByRole('radio', { name: 'Sí, otros locales' }).click();
  await captura(celular, 'portal-paso3-cuestionario', true);
  await celular.getByRole('button', { name: 'Siguiente' }).click();
  await celular.getByRole('heading', { name: 'CV y envío' }).waitFor();

  await celular.locator('#cv').setInputFiles({ name: 'cv-escaneado.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(12 * 1024 * 1024, 1) });
  await celular.getByText('Solo se aceptan PDF o Word de hasta 10 MB. Puedes enviar sin CV.').waitFor();
  comprobar(!(await celular.getByTestId('cv-adjunto').isVisible()), 'el CV de 12 MB no se adjunta');
  await captura(celular, 'portal-cv-12mb-rechazado', true);

  await celular.locator('#cv').setInputFiles({ name: 'cv-valentina.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 CV de prueba') });
  await celular.getByTestId('cv-adjunto').waitFor();
  comprobar(await celular.getByRole('button', { name: 'Enviar postulación' }).isDisabled(), '«Enviar» está deshabilitado sin el consentimiento');
  comprobar(!(await celular.getByTestId('estado-exito').isVisible()), 'la confirmación de éxito no aparece antes de enviar');
  await celular.getByRole('checkbox', { name: /Autorizo a Quova/ }).check();
  await captura(celular, 'portal-paso4-cv-y-consentimiento', true);
  await celular.getByRole('button', { name: 'Enviar postulación' }).click();
  await celular.getByTestId('estado-exito').waitFor();
  await captura(celular, 'portal-postulacion-enviada');

  // DNI duplicado: se detecta al terminar el paso 1
  await celular.goto(link);
  await celular.getByLabel('Nombre completo').fill('Valentina Cruz Huertas');
  await celular.getByLabel('DNI (8 dígitos)').fill('76543210');
  await celular.getByLabel('Celular (9 dígitos)').fill('987654321');
  await celular.getByLabel('Distrito de residencia').selectOption('Surquillo');
  await celular.getByRole('button', { name: 'Siguiente' }).click();
  await celular.getByTestId('estado-duplicada').waitFor();
  await captura(celular, 'portal-dni-duplicado');

  // Vacante cerrada y enlace a otras vacantes
  await celular.goto(`${BASE}/postular/demo-cerrada`);
  await celular.getByTestId('estado-vacante-cerrada').waitFor();
  await captura(celular, 'portal-vacante-cerrada');
  await celular.getByRole('link', { name: 'Ver otras vacantes de Quova' }).click();
  await celular.getByTestId('lista-vacantes').waitFor();
  await captura(celular, 'portal-otras-vacantes', true);

  // La vacante se cierra mientras el candidato llena el formulario
  await celular.goto(`${BASE}/postular/demo-caj-mira`);
  await llenarHastaPaso4(celular, { nombre: 'Rodrigo Palomino Vera', dni: '70998877', celular: '912345678' });
  await celular.getByRole('checkbox', { name: /Autorizo a Quova/ }).check();

  await panel.getByLabel('Buscar por cargo o tienda').fill('cajero miraflores');
  await panel.getByTestId('contador-vacantes').getByText('1 vacante encontrada').waitFor();
  await panel.getByRole('button', { name: 'Cerrar vacante Cajero/a · Miraflores' }).click();
  await panel.getByRole('dialog', { name: '¿Cerrar la vacante?' }).waitFor();
  await captura(panel, 'cerrar-vacante-confirmacion');
  await panel.getByRole('button', { name: 'Sí, cerrar vacante' }).click();
  await panel.getByTestId('aviso-exito').waitFor();
  await panel.getByRole('row', { name: /Cerrada/ }).waitFor();

  await celular.getByRole('button', { name: 'Enviar postulación' }).click();
  await celular.getByTestId('estado-cerrada-durante').waitFor();
  await captura(celular, 'portal-vacante-cerrada-mientras-postulaba');

  // Error de envío con «Reintentar»: se corta la red solo para el envío
  await celular.goto(`${BASE}/postular/demo-vend-molina`);
  await llenarHastaPaso4(celular, { nombre: 'Rodrigo Palomino Vera', dni: '70998877', celular: '912345678' });
  await celular.getByRole('checkbox', { name: /Autorizo a Quova/ }).check();
  tolerarFallaDeRed = true;
  await celular.route('**/postulaciones**', (ruta) => ruta.abort());
  await celular.getByRole('button', { name: 'Enviar postulación' }).click();
  await celular.getByTestId('estado-error-envio').waitFor();
  await captura(celular, 'portal-error-de-envio');
  await celular.unroute('**/postulaciones**');
  await celular.waitForTimeout(300);
  tolerarFallaDeRed = false;
  await celular.getByRole('button', { name: 'Reintentar' }).click();
  await celular.getByTestId('estado-exito').waitFor();
  comprobar(true, 'el reintento envía la postulación sin volver a escribir los datos');
  await captura(celular, 'portal-reintento-exitoso');

  // ---------- D. Pipeline ----------
  console.log('D. Pipeline');
  await panel.getByRole('link', { name: /^Pipeline/ }).click();
  await panel.getByTestId('tablero').waitFor();
  await captura(panel, 'pipeline-tablero');

  await panel.getByLabel('Vacante').selectOption({ label: 'Cajero/a · Surco' });
  await enColumna(panel, 'NUEVO', 'Valentina Cruz Huertas').waitFor();
  comprobar((await tarjeta(panel, 'Valentina Cruz Huertas').innerText()).includes('LinkedIn'), 'la tarjeta registra la fuente del link (LinkedIn)');
  await captura(panel, 'pipeline-candidata-en-nuevo');

  await tarjeta(panel, 'Valentina Cruz Huertas').getByRole('button', { name: /^Avanzar/ }).click();
  await panel.getByRole('dialog').getByText('Esta acción no se puede revertir.').waitFor();
  await captura(panel, 'pipeline-confirmar-avance');
  await panel.getByRole('button', { name: 'Sí, avanzar' }).click();
  await enColumna(panel, 'PRESELECCIONADO', 'Valentina Cruz Huertas').waitFor();
  await captura(panel, 'pipeline-avance-con-boton');

  await tarjeta(panel, 'Valentina Cruz Huertas').dragTo(panel.getByTestId('columna-ENTREVISTA'));
  await panel.getByRole('dialog').getByText('Esta acción no se puede revertir.').waitFor();
  await captura(panel, 'pipeline-arrastrar-pide-confirmacion');
  await panel.getByRole('button', { name: 'Sí, avanzar' }).click();
  await enColumna(panel, 'ENTREVISTA', 'Valentina Cruz Huertas').waitFor();

  await tarjeta(panel, 'Valentina Cruz Huertas').dragTo(panel.getByTestId('columna-NUEVO'));
  await panel.getByRole('dialog', { name: 'Movimiento no permitido' }).waitFor();
  await captura(panel, 'pipeline-retroceso-bloqueado');
  await panel.getByRole('button', { name: 'Entendido' }).click();
  comprobar(await enColumna(panel, 'ENTREVISTA', 'Valentina Cruz Huertas').isVisible(), 'la tarjeta volvió a su columna tras el intento de retroceso');

  await tarjeta(panel, 'Valentina Cruz Huertas').getByRole('button', { name: /^Ver historial/ }).click();
  await panel.getByTestId('historial').locator('li').nth(2).waitFor();
  comprobar((await panel.getByTestId('historial').locator('li').count()) === 3, 'historial_etapa registró la postulación y los dos avances');
  await captura(panel, 'pipeline-historial-de-etapas');
  await panel.getByRole('button', { name: 'Cerrar', exact: true }).last().click();

  await panel.getByRole('button', { name: 'Limpiar filtros' }).click();
  await tarjeta(panel, 'Diego Huamán Quispe').getByRole('button', { name: /^Descartar/ }).click();
  await panel.getByRole('dialog', { name: /Descartar a Diego/ }).waitFor();
  comprobar(await panel.getByRole('button', { name: 'Confirmar' }).isDisabled(), '«Confirmar» está deshabilitado hasta elegir un motivo');
  await captura(panel, 'pipeline-descartar-sin-motivo');
  await panel.getByRole('radio', { name: 'No tiene disponibilidad para el turno' }).check();
  await panel.getByRole('dialog').locator('textarea').fill('Solo puede trabajar en las mañanas.');
  await panel.getByRole('checkbox', { name: /Guardar en banco de talento/ }).check();
  comprobar(await panel.getByRole('button', { name: 'Confirmar' }).isEnabled(), '«Confirmar» se habilita al elegir el motivo');
  await captura(panel, 'pipeline-descartar-con-motivo');
  await panel.getByRole('button', { name: 'Confirmar' }).click();
  await panel.getByTestId('aviso-exito').getByText(/banco de talento/).waitFor();
  await panel.getByRole('checkbox', { name: 'Mostrar descartados' }).check();
  await enColumna(panel, 'DESCARTADO', 'Diego Huamán Quispe').waitFor();
  await enColumna(panel, 'DESCARTADO', 'Diego Huamán Quispe').scrollIntoViewIfNeeded();
  await captura(panel, 'pipeline-descartados-y-banco-de-talento');

  // ---------- A. Estados del login y roles ----------
  console.log('A. Estados del login y roles');
  await panel.getByRole('button', { name: 'Cerrar sesión' }).click();
  await panel.waitForURL('**/login');

  await panel.fill('#correo', 'gerente@gmail.com');
  await panel.fill('#password', 'cualquiera');
  await panel.getByRole('button', { name: 'Iniciar sesión' }).click();
  await panel.getByText('Usa tu correo corporativo @quova.pe.').waitFor();
  await captura(panel, 'login-correo-no-corporativo');

  for (let intento = 1; intento <= 5; intento++) {
    await panel.fill('#correo', 'gerente@quova.pe');
    await panel.fill('#password', `incorrecta-${intento}`);
    await panel.getByRole('button', { name: 'Iniciar sesión' }).click();
    if (intento < 5) {
      const restantes = 5 - intento;
      await panel.getByTestId('login-error').getByText(restantes === 1 ? 'Te queda 1 intento.' : `Te quedan ${restantes} intentos.`, { exact: false }).waitFor();
      if (intento === 1) {
        comprobar((await panel.getByTestId('login-error').innerText()).includes('Correo o contraseña incorrectos.'), 'el mensaje de error es genérico');
        await captura(panel, 'login-fallido-intentos-restantes');
      }
    }
  }
  await panel.getByTestId('login-error').getByText('Cuenta bloqueada temporalmente').waitFor();
  await captura(panel, 'login-bloqueado-tras-5-intentos');

  await panel.fill('#correo', 'gerente@quova.pe');
  await panel.fill('#password', CLAVE);
  await panel.getByRole('button', { name: 'Iniciar sesión' }).click();
  await panel.getByTestId('login-error').getByText('Cuenta bloqueada temporalmente').waitFor();
  comprobar(true, 'durante el bloqueo ni la contraseña correcta permite entrar');

  await panel.fill('#correo', 'inactivo@quova.pe');
  await panel.fill('#password', CLAVE);
  await panel.getByRole('button', { name: 'Iniciar sesión' }).click();
  await panel.getByTestId('login-error').getByText('Tu cuenta está inactiva. Contacta a TI.').waitFor();
  await captura(panel, 'login-usuario-inactivo');

  await iniciarSesion(panel, 'jefe.miraflores@quova.pe');
  await panel.waitForURL('**/dashboard');
  await panel.getByTestId('grafico-etapas').locator('svg').first().waitFor();
  comprobar(!(await panel.getByRole('link', { name: 'Nueva vacante' }).isVisible()), 'el jefe de tienda no ve «+ Nueva vacante»');
  comprobar(!(await panel.getByRole('link', { name: /Configuración/ }).isVisible()), 'el jefe de tienda no ve «Configuración» en el menú');
  await captura(panel, 'rol-jefe-de-tienda-dashboard');

  await panel.getByRole('link', { name: /^Pipeline/ }).click();
  await panel.getByText('Tu rol solo permite consultar el pipeline.').waitFor();
  await panel.getByTestId('tablero').waitFor();
  comprobar((await panel.getByRole('button', { name: /^Avanzar/ }).count()) === 0, 'el jefe de tienda no puede mover candidatos');
  await captura(panel, 'rol-jefe-de-tienda-pipeline');

  await panel.getByRole('link', { name: /Cal\. Entrevistas/ }).click();
  await panel.getByRole('heading', { name: 'Calendario de entrevistas', level: 2 }).waitFor();
  await captura(panel, 'modulo-proximamente');

  await panel.goto(`${BASE}/vacantes/nueva`);
  await panel.getByText('No tienes acceso a este módulo').waitFor();
  await captura(panel, 'sin-acceso-por-rol');

  // ---------- Documentación de la API ----------
  const swagger = await escritorio.newPage();
  await swagger.goto(`${API}/swagger-ui.html`);
  await swagger.getByText('Quova ATS API').first().waitFor();
  await swagger.waitForTimeout(800);
  await captura(swagger, 'swagger-ui');
  await swagger.close();
} catch (error) {
  problemas.push(`[flujo] ${error.message}`);
  await panel.screenshot({ path: resolve(CAPTURAS, '..', 'fallo-panel.png') }).catch(() => undefined);
  await celular.screenshot({ path: resolve(CAPTURAS, '..', 'fallo-portal.png') }).catch(() => undefined);
}

await navegador.close();

console.log(`\nCapturas generadas: ${lista.length}`);
if (problemas.length) {
  console.error(`\nSe encontraron ${problemas.length} problemas:`);
  for (const p of problemas) console.error(` - ${p}`);
  process.exit(1);
}
console.log('Sin errores de consola ni de red inesperados.');

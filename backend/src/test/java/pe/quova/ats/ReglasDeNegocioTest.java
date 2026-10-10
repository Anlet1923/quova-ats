package pe.quova.ats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.fasterxml.jackson.databind.ObjectMapper;

import pe.quova.ats.config.DataLoader;
import pe.quova.ats.model.Candidato;
import pe.quova.ats.model.Etapa;
import pe.quova.ats.repo.CandidatoRepository;
import pe.quova.ats.repo.HistorialEtapaRepository;

/** Reglas de negocio del avance 40 %, probadas contra la API con los datos de prueba del DataLoader. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReglasDeNegocioTest {

	private static final String VACANTE_ABIERTA = "demo-vend-mira";
	private static final String OTRA_VACANTE_ABIERTA = "demo-caj-sisi";
	private static final String VACANTE_CERRADA = "demo-cerrada";

	@Autowired
	private MockMvc mvc;
	@Autowired
	private ObjectMapper json;
	@Autowired
	private CandidatoRepository candidatos;
	@Autowired
	private HistorialEtapaRepository historial;

	// ---------- Regla 1: DNI duplicado ----------

	@Test
	@DisplayName("Un mismo DNI no puede postular dos veces a la misma vacante (409)")
	void dniDuplicadoEnLaMismaVacante() throws Exception {
		// 71234501 es Lucía Fernández, que ya postuló a esta vacante en los datos de prueba
		postular(VACANTE_ABIERTA, postulacion("71234501"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.codigo").value("POSTULACION_DUPLICADA"));

		mvc.perform(get("/api/public/vacantes/{token}/verificar-dni", VACANTE_ABIERTA).param("dni", "71234501"))
				.andExpect(status().isConflict());
	}

	@Test
	@DisplayName("El mismo DNI sí puede postular a una vacante distinta (201)")
	void mismoDniEnOtraVacante() throws Exception {
		postular(OTRA_VACANTE_ABIERTA, postulacion("71234501"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.vacante").value("Cajero/a"));
	}

	@Test
	@DisplayName("Los datos inválidos se rechazan en el backend con el error por campo (400)")
	void datosInvalidos() throws Exception {
		Map<String, Object> datos = postulacion("1234");
		datos.put("celular", "812345678");
		datos.put("motivacion", "corto");
		datos.put("turnos", List.of());
		datos.put("consentimiento", false);

		postular(VACANTE_ABIERTA, datos)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errores.dni").value("El DNI debe tener 8 dígitos numéricos."))
				.andExpect(jsonPath("$.errores.celular").exists())
				.andExpect(jsonPath("$.errores.motivacion").exists())
				.andExpect(jsonPath("$.errores.turnos").value("Elige al menos un turno."))
				.andExpect(jsonPath("$.errores.consentimiento").exists());
	}

	@Test
	@DisplayName("El tiempo de experiencia es obligatorio solo si el candidato tiene experiencia en retail")
	void tiempoDeExperienciaCondicional() throws Exception {
		Map<String, Object> datos = postulacion("70000001");
		datos.put("experienciaRetail", true);
		datos.put("tiempoExperiencia", null);

		postular(VACANTE_ABIERTA, datos)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errores.tiempoExperiencia").exists());
	}

	@Test
	@DisplayName("Un CV que no es PDF ni Word se rechaza (400)")
	void cvConFormatoNoPermitido() throws Exception {
		MockMultipartFile cv = new MockMultipartFile("cv", "foto.png", "image/png", new byte[] { 1, 2, 3 });
		mvc.perform(multipart("/api/public/vacantes/{token}/postulaciones", VACANTE_ABIERTA)
				.file(parteDatos(postulacion("70000002"))).file(cv))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errores.cv").exists());
	}

	// ---------- Regla 3: vacante cerrada ----------

	@Test
	@DisplayName("Una vacante cerrada no muestra el formulario ni acepta postulaciones (410)")
	void vacanteCerrada() throws Exception {
		mvc.perform(get("/api/public/vacantes/{token}", VACANTE_CERRADA))
				.andExpect(status().isGone())
				.andExpect(jsonPath("$.codigo").value("VACANTE_CERRADA"));

		postular(VACANTE_CERRADA, postulacion("70000003"))
				.andExpect(status().isGone())
				.andExpect(jsonPath("$.codigo").value("VACANTE_CERRADA"));
	}

	// ---------- Regla 2: no retroceder de etapa ----------

	@Test
	@DisplayName("La regla de avance solo permite etapas posteriores")
	void reglaDeAvance() {
		assertThat(Etapa.ENTREVISTA.puedeAvanzarA(Etapa.PRUEBA)).isTrue();
		assertThat(Etapa.ENTREVISTA.puedeAvanzarA(Etapa.CONTRATADO)).isTrue();
		assertThat(Etapa.ENTREVISTA.puedeAvanzarA(Etapa.ENTREVISTA)).isFalse();
		assertThat(Etapa.ENTREVISTA.puedeAvanzarA(Etapa.NUEVO)).isFalse();
		assertThat(Etapa.ENTREVISTA.puedeAvanzarA(Etapa.DESCARTADO)).isFalse();
		assertThat(Etapa.CONTRATADO.puedeAvanzarA(Etapa.OFERTA)).isFalse();
		assertThat(Etapa.DESCARTADO.puedeAvanzarA(Etapa.NUEVO)).isFalse();
	}

	@Test
	@DisplayName("Un candidato no puede retroceder de etapa (409) y cada avance queda en historial_etapa")
	void noRetrocederDeEtapa() throws Exception {
		Candidato kevin = candidato("Kevin Ramos Soto");
		String token = iniciarSesion("reclutador@quova.pe");
		int registrosAntes = historial.buscarPorCandidato(kevin.getId()).size();

		mvc.perform(post("/api/candidatos/{id}/mover", kevin.getId()).header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"etapaDestino\":\"NUEVO\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.codigo").value("MOVIMIENTO_NO_PERMITIDO"))
				.andExpect(jsonPath("$.etapaActual").value("ENTREVISTA"));
		assertThat(candidato("Kevin Ramos Soto").getEtapa()).isEqualTo(Etapa.ENTREVISTA);
		assertThat(historial.buscarPorCandidato(kevin.getId())).hasSize(registrosAntes);

		mvc.perform(post("/api/candidatos/{id}/mover", kevin.getId()).header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"etapaDestino\":\"PRUEBA\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.etapa").value("PRUEBA"));

		var registros = historial.buscarPorCandidato(kevin.getId());
		assertThat(registros).hasSize(registrosAntes + 1);
		var ultimo = registros.get(registros.size() - 1);
		assertThat(ultimo.getEtapaOrigen()).isEqualTo(Etapa.ENTREVISTA);
		assertThat(ultimo.getEtapaDestino()).isEqualTo(Etapa.PRUEBA);
		assertThat(ultimo.getUsuario().getCorreo()).isEqualTo("reclutador@quova.pe");
	}

	@Test
	@DisplayName("Solo el reclutador mueve candidatos: el jefe de tienda recibe 403")
	void soloElReclutadorMueve() throws Exception {
		Candidato andrea = candidato("Andrea Salazar Luna");
		mvc.perform(post("/api/candidatos/{id}/mover", andrea.getId())
				.header("Authorization", iniciarSesion("jefe.miraflores@quova.pe"))
				.contentType(MediaType.APPLICATION_JSON).content("{\"etapaDestino\":\"ENTREVISTA\"}"))
				.andExpect(status().isForbidden());
	}

	// ---------- Regla 4: motivo obligatorio al descartar ----------

	@Test
	@DisplayName("Descartar exige un motivo (400) y puede guardar al candidato en el banco de talento")
	void motivoObligatorioAlDescartar() throws Exception {
		Candidato camila = candidato("Camila Torres Vega");
		String token = iniciarSesion("reclutador@quova.pe");

		mvc.perform(post("/api/candidatos/{id}/descartar", camila.getId()).header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"comentario\":\"sin motivo\",\"bancoTalento\":true}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errores.motivo").value("Elige un motivo de descarte."));
		assertThat(candidato("Camila Torres Vega").getEtapa()).isEqualTo(Etapa.NUEVO);

		mvc.perform(post("/api/candidatos/{id}/descartar", camila.getId()).header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"motivo\":\"NO_DISPONIBILIDAD_TURNO\",\"bancoTalento\":true}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.etapa").value("DESCARTADO"))
				.andExpect(jsonPath("$.bancoTalento").value(true));

		// Un descartado ya no se puede mover
		mvc.perform(post("/api/candidatos/{id}/mover", camila.getId()).header("Authorization", token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"etapaDestino\":\"OFERTA\"}"))
				.andExpect(status().isConflict());
	}

	// ---------- Seguridad: bloqueo tras 5 intentos ----------

	@Test
	@DisplayName("Tras 5 intentos fallidos la cuenta se bloquea 15 minutos (423), incluso con la contraseña correcta")
	void bloqueoTrasCincoIntentos() throws Exception {
		for (int intento = 1; intento <= 4; intento++) {
			login("gerente@quova.pe", "incorrecta")
					.andExpect(status().isUnauthorized())
					.andExpect(jsonPath("$.intentosRestantes").value(5 - intento));
		}
		login("gerente@quova.pe", "incorrecta").andExpect(status().isLocked())
				.andExpect(jsonPath("$.minutosRestantes").value(15));
		login("gerente@quova.pe", DataLoader.CLAVE_DEMO).andExpect(status().isLocked());
	}

	@Test
	@DisplayName("Un usuario inactivo no puede entrar (403) y un correo no corporativo se rechaza (400)")
	void usuarioInactivoYCorreoNoCorporativo() throws Exception {
		login("inactivo@quova.pe", DataLoader.CLAVE_DEMO).andExpect(status().isForbidden())
				.andExpect(jsonPath("$.codigo").value("USUARIO_INACTIVO"));
		login("alguien@gmail.com", DataLoader.CLAVE_DEMO).andExpect(status().isBadRequest());
	}

	// ---------- Utilidades ----------

	private Map<String, Object> postulacion(String dni) {
		Map<String, Object> datos = new LinkedHashMap<>();
		datos.put("nombre", "Prueba Automatizada");
		datos.put("dni", dni);
		datos.put("celular", "987654321");
		datos.put("correo", null);
		datos.put("distrito", "Miraflores");
		datos.put("inicio", "INMEDIATA");
		datos.put("turnos", List.of("TARDE"));
		datos.put("experienciaRetail", false);
		datos.put("tiempoExperiencia", null);
		datos.put("motivacion", "Quiero trabajar en una cadena de moda como Quova.");
		datos.put("atencionAfluencia", "Atiendo por orden de llegada y mantengo la calma.");
		datos.put("otrosLocales", true);
		datos.put("consentimiento", true);
		return datos;
	}

	private MockMultipartFile parteDatos(Map<String, Object> datos) throws Exception {
		return new MockMultipartFile("datos", "", MediaType.APPLICATION_JSON_VALUE,
				json.writeValueAsString(datos).getBytes(StandardCharsets.UTF_8));
	}

	private ResultActions postular(String token, Map<String, Object> datos) throws Exception {
		return mvc.perform(multipart("/api/public/vacantes/{token}/postulaciones", token).file(parteDatos(datos)));
	}

	private ResultActions login(String correo, String password) throws Exception {
		return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(Map.of("correo", correo, "password", password))));
	}

	private String iniciarSesion(String correo) throws Exception {
		String cuerpo = login(correo, DataLoader.CLAVE_DEMO).andExpect(status().isOk()).andReturn().getResponse()
				.getContentAsString(StandardCharsets.UTF_8);
		return "Bearer " + json.readTree(cuerpo).get("token").asText();
	}

	private Candidato candidato(String nombre) {
		return candidatos.findAll().stream().filter(c -> c.getNombre().equals(nombre)).findFirst().orElseThrow();
	}
}

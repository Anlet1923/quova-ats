package pe.quova.ats.config;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pe.quova.ats.model.Candidato;
import pe.quova.ats.model.Cargo;
import pe.quova.ats.model.Enums.DisponibilidadInicio;
import pe.quova.ats.model.Enums.EstadoVacante;
import pe.quova.ats.model.Enums.Fuente;
import pe.quova.ats.model.Enums.MotivoDescarte;
import pe.quova.ats.model.Enums.Rol;
import pe.quova.ats.model.Enums.Turno;
import pe.quova.ats.model.Etapa;
import pe.quova.ats.model.HistorialEtapa;
import pe.quova.ats.model.Tienda;
import pe.quova.ats.model.Usuario;
import pe.quova.ats.model.Vacante;
import pe.quova.ats.repo.CandidatoRepository;
import pe.quova.ats.repo.CargoRepository;
import pe.quova.ats.repo.HistorialEtapaRepository;
import pe.quova.ats.repo.TiendaRepository;
import pe.quova.ats.repo.UsuarioRepository;
import pe.quova.ats.repo.VacanteRepository;

/**
 * Datos de prueba que se cargan una sola vez (si la BD está vacía). Las fechas son relativas a hoy para que los
 * "días en la etapa" y los indicadores del dashboard tengan sentido el día de la demo.
 */
@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(DataLoader.class);
	public static final String CLAVE_DEMO = "Quova2026!";

	private final TiendaRepository tiendas;
	private final CargoRepository cargos;
	private final UsuarioRepository usuarios;
	private final VacanteRepository vacantes;
	private final CandidatoRepository candidatos;
	private final HistorialEtapaRepository historial;
	private final PasswordEncoder encoder;

	private final LocalDateTime ahora = LocalDateTime.now();
	private Usuario reclutador;

	@Override
	@Transactional
	public void run(String... args) {
		if (usuarios.count() > 0) {
			return;
		}

		Tienda miraflores = tienda("Miraflores", "Av. Larco 345", true);
		Tienda sanIsidro = tienda("San Isidro", "Av. Conquistadores 510", true);
		Tienda surco = tienda("Surco", "Av. Javier Prado Este 4200, Jockey Plaza", true);
		Tienda laMolina = tienda("La Molina", "Av. La Molina 1120", true);
		Tienda losOlivos = tienda("Los Olivos", "Av. Alfredo Mendiola 3698", true);
		tienda("San Borja", "Av. San Borja Sur 480", false);

		Cargo vendedor = cargo("Vendedor/a", "1250",
				"Atiende y asesora a los clientes en piso de venta, mantiene el orden del local y apoya el cumplimiento de las metas de la tienda.",
				"Secundaria completa. Gusto por la moda y la atención al cliente. Disponibilidad para trabajar fines de semana y feriados.");
		Cargo cajero = cargo("Cajero/a", "1200",
				"Registra las ventas en caja, realiza cobros y cambios, y efectúa el arqueo al cierre del turno.",
				"Secundaria completa. Experiencia mínima de 3 meses manejando efectivo o POS. Orden y responsabilidad.");
		Cargo encargado = cargo("Encargado de local", "2100",
				"Lidera al equipo de la tienda, organiza los turnos, controla el inventario y responde por los resultados de venta.",
				"Estudios técnicos o universitarios. Un año de experiencia liderando equipos en retail. Manejo de indicadores.");
		Cargo almacen = cargo("Personal de almacén", "1100",
				"Recibe, ordena y despacha la mercadería; apoya en los inventarios y en la reposición del piso de venta.",
				"Secundaria completa. Capacidad para cargar peso moderado. Orden y puntualidad.");

		usuario("Ana Torres", "admin@quova.pe", Rol.ADMIN, null, true);
		reclutador = usuario("Carla Mendoza", "reclutador@quova.pe", Rol.RECLUTADOR, null, true);
		usuario("Luis Paredes", "jefe.miraflores@quova.pe", Rol.JEFE_TIENDA, miraflores, true);
		usuario("Rosa Villanueva", "gerente@quova.pe", Rol.GERENTE_REGIONAL, null, true);
		usuario("Usuario Inactivo", "inactivo@quova.pe", Rol.RECLUTADOR, null, false);

		Vacante v1 = vacante(vendedor, miraflores, Turno.TARDE, 3, true, EstadoVacante.ABIERTA, "demo-vend-mira", 12, 0);
		Vacante v2 = vacante(cajero, sanIsidro, Turno.MANANA, 2, false, EstadoVacante.ABIERTA, "demo-caj-sisi", 10, 0);
		Vacante v3 = vacante(almacen, surco, Turno.MANANA, 2, false, EstadoVacante.ABIERTA, "demo-alm-surco", 20, 0);
		Vacante v4 = vacante(vendedor, laMolina, Turno.FIN_DE_SEMANA, 4, true, EstadoVacante.ABIERTA, "demo-vend-molina", 6, 0);
		Vacante v5 = vacante(encargado, losOlivos, Turno.ROTATIVO, 1, false, EstadoVacante.ABIERTA, "demo-enc-olivos", 40, 0);
		Vacante v6 = vacante(cajero, miraflores, Turno.TARDE, 1, false, EstadoVacante.ABIERTA, "demo-caj-mira", 3, 0);
		Vacante v7 = vacante(vendedor, surco, Turno.ROTATIVO, 2, false, EstadoVacante.ABIERTA, "demo-vend-surco", 45, 0);
		Vacante v8 = vacante(almacen, losOlivos, Turno.TARDE, 2, false, EstadoVacante.CERRADA, "demo-cerrada", 55, 20);
		vacante(cajero, laMolina, Turno.ROTATIVO, 1, false, EstadoVacante.BORRADOR, null, 1, 0);

		// En proceso (15): nombre, DNI, distrito, fuente, etapa, días desde que postuló, días en la etapa
		activo(v1, "Lucía Fernández Rojas", "71234501", "Miraflores", Fuente.WEB_QUOVA, Etapa.NUEVO, 0, 0);
		activo(v1, "Diego Huamán Quispe", "72345602", "Surquillo", Fuente.LINKEDIN, Etapa.NUEVO, 2, 2);
		activo(v4, "Camila Torres Vega", "73456703", "La Molina", Fuente.COMPUTRABAJO, Etapa.NUEVO, 1, 1);
		activo(v2, "José Mendoza Paredes", "74567804", "Lince", Fuente.WEB_QUOVA, Etapa.NUEVO, 5, 5);
		activo(v6, "Valeria Castillo Ríos", "70112233", "Barranco", Fuente.LINKEDIN, Etapa.NUEVO, 0, 0);
		activo(v1, "Andrea Salazar Luna", "75678905", "Chorrillos", Fuente.REFERIDO, Etapa.PRESELECCIONADO, 6, 3);
		activo(v3, "Renzo Chávez Molina", "76789006", "Surco", Fuente.BUMERAN, Etapa.PRESELECCIONADO, 8, 4);
		activo(v4, "Mariana Flores Díaz", "77890107", "Ate", Fuente.LINKEDIN, Etapa.PRESELECCIONADO, 4, 1);
		activo(v2, "Kevin Ramos Soto", "78901208", "San Isidro", Fuente.WEB_QUOVA, Etapa.ENTREVISTA, 9, 2);
		activo(v1, "Fiorella Gutiérrez Paz", "79012309", "Miraflores", Fuente.LINKEDIN, Etapa.ENTREVISTA, 10, 5);
		activo(v5, "Bruno Vargas León", "70223344", "Los Olivos", Fuente.COMPUTRABAJO, Etapa.ENTREVISTA, 14, 3);
		activo(v3, "Sofía Navarro Cruz", "70123410", "San Juan de Miraflores", Fuente.WEB_QUOVA, Etapa.PRUEBA, 12, 1);
		activo(v7, "Luis Alberto Poma Ccori", "71234511", "Villa El Salvador", Fuente.REFERIDO, Etapa.PRUEBA, 15, 6);
		activo(v5, "Daniela Rojas Campos", "72345612", "Comas", Fuente.LINKEDIN, Etapa.OFERTA, 18, 2);
		activo(v7, "Marco Antonio Silva Peña", "73456713", "Surco", Fuente.WEB_QUOVA, Etapa.OFERTA, 16, 0);

		// Contratados: tres en los últimos 30 días y dos en los 30 anteriores
		activo(v3, "Paola Espinoza Vera", "74567814", "Surco", Fuente.WEB_QUOVA, Etapa.CONTRATADO, 19, 10);
		activo(v7, "Jorge Luis Cárdenas Ruiz", "75678915", "Chorrillos", Fuente.LINKEDIN, Etapa.CONTRATADO, 25, 14);
		activo(v8, "Milagros Quispe Ticona", "76789016", "Los Olivos", Fuente.REFERIDO, Etapa.CONTRATADO, 32, 22);
		activo(v8, "Carlos Enrique Aguilar Meza", "77890117", "Independencia", Fuente.COMPUTRABAJO, Etapa.CONTRATADO, 50, 38);
		activo(v8, "Rosa María Delgado Ñahui", "78901218", "Comas", Fuente.WEB_QUOVA, Etapa.CONTRATADO, 52, 38);

		// Descartados: etapa en la que estaban, motivo y si quedaron en el banco de talento
		descartado(v1, "Pedro Alonso Ramírez Tello", "79012319", "Surquillo", Fuente.BUMERAN, Etapa.PRESELECCIONADO, 8, 5,
				MotivoDescarte.NO_CUMPLE_PERFIL, false);
		descartado(v2, "Gabriela Montes Ortiz", "70123420", "Jesús María", Fuente.LINKEDIN, Etapa.ENTREVISTA, 7, 3,
				MotivoDescarte.DESISTIO, false);
		descartado(v4, "Henry Yupanqui Mamani", "71234521", "Ate", Fuente.WEB_QUOVA, Etapa.NUEVO, 5, 2,
				MotivoDescarte.NO_DISPONIBILIDAD_TURNO, true);
		descartado(v8, "Ximena Paredes Solís", "72345622", "Los Olivos", Fuente.COMPUTRABAJO, Etapa.NUEVO, 48, 40,
				MotivoDescarte.NO_RESPONDE, false);
		descartado(v7, "Óscar Benites Farfán", "73456723", "Surco", Fuente.LINKEDIN, Etapa.OFERTA, 43, 36,
				MotivoDescarte.PRETENSION_SALARIAL, true);
		descartado(v8, "Karla Zevallos Pinto", "74567824", "Puente Piedra", Fuente.WEB_QUOVA, Etapa.PRESELECCIONADO, 45, 41,
				MotivoDescarte.NO_CUMPLE_PERFIL, false);

		log.info("Datos de prueba cargados: {} tiendas, {} cargos, {} usuarios, {} vacantes y {} candidatos.",
				tiendas.count(), cargos.count(), usuarios.count(), vacantes.count(), candidatos.count());
	}

	private Tienda tienda(String nombre, String direccion, boolean activa) {
		return tiendas.save(Tienda.builder().nombre(nombre).direccion(direccion).distrito(nombre).activa(activa)
				.build());
	}

	private Cargo cargo(String nombre, String salarioBase, String descripcion, String requisitos) {
		return cargos.save(Cargo.builder().nombre(nombre).salarioBase(new BigDecimal(salarioBase))
				.descripcion(descripcion).requisitos(requisitos).build());
	}

	private Usuario usuario(String nombre, String correo, Rol rol, Tienda tienda, boolean activo) {
		return usuarios.save(Usuario.builder().nombre(nombre).correo(correo)
				.passwordHash(encoder.encode(CLAVE_DEMO)).rol(rol).tienda(tienda).activo(activo).build());
	}

	private Vacante vacante(Cargo cargo, Tienda tienda, Turno turno, int puestos, boolean urgente,
			EstadoVacante estado, String token, int diasPublicada, int diasCerrada) {
		LocalDateTime creada = ahora.minusDays(diasPublicada).minusHours(3);
		return vacantes.save(Vacante.builder().cargo(cargo).tienda(tienda).turno(turno).puestos(puestos)
				.salario(cargo.getSalarioBase()).fechaCierre(ahora.toLocalDate().plusDays(21))
				.descripcion(cargo.getDescripcion()).requisitos(cargo.getRequisitos()).urgente(urgente)
				.estado(estado).token(token).creadaEn(creada)
				.publicadaEn(estado == EstadoVacante.BORRADOR ? null : creada)
				.cerradaEn(estado == EstadoVacante.CERRADA ? ahora.minusDays(diasCerrada) : null)
				.creadaPor(reclutador).build());
	}

	private void activo(Vacante v, String nombre, String dni, String distrito, Fuente fuente, Etapa etapa,
			int diasPostulo, int diasEnEtapa) {
		guardar(v, nombre, dni, distrito, fuente, etapa, etapa, diasPostulo, diasEnEtapa, null, false);
	}

	private void descartado(Vacante v, String nombre, String dni, String distrito, Fuente fuente, Etapa etapaPrevia,
			int diasPostulo, int diasDescartado, MotivoDescarte motivo, boolean bancoTalento) {
		guardar(v, nombre, dni, distrito, fuente, Etapa.DESCARTADO, etapaPrevia, diasPostulo, diasDescartado, motivo,
				bancoTalento);
	}

	private void guardar(Vacante v, String nombre, String dni, String distrito, Fuente fuente, Etapa etapa,
			Etapa ultimaEtapaDelProceso, int diasPostulo, int diasEnEtapa, MotivoDescarte motivo,
			boolean bancoTalento) {
		LocalDateTime creado = ahora.minusDays(diasPostulo).minusHours(diasPostulo == 0 ? 1 : 2);
		LocalDateTime desde = diasEnEtapa == diasPostulo ? creado : ahora.minusDays(diasEnEtapa).minusHours(1);
		boolean conExperiencia = Integer.parseInt(dni.substring(7)) % 3 != 0;
		Candidato c = candidatos.save(Candidato.builder().vacante(v).nombre(nombre).dni(dni)
				.celular("9" + dni).correo(null).distrito(distrito).inicio(DisponibilidadInicio.INMEDIATA)
				.turnos(Set.of(v.getTurno())).experienciaRetail(conExperiencia)
				.tiempoExperiencia(conExperiencia ? "6 meses a 1 año" : null)
				.motivacion("Me gusta la moda y quiero crecer en una cadena con varias tiendas como Quova.")
				.atencionAfluencia("Mantengo la calma, saludo a cada cliente y priorizo a quien ya está por decidir su compra.")
				.otrosLocales(true).consentimiento(true).fuente(fuente).etapa(etapa).etapaDesde(desde)
				.creadoEn(creado).motivoDescarte(motivo).bancoTalento(bancoTalento).build());

		// Historial: la postulación y luego cada avance, repartidos entre la fecha de postulación y la etapa actual
		List<Etapa> recorrido = new ArrayList<>();
		for (Etapa e : Etapa.values()) {
			if (e.ordinal() <= ultimaEtapaDelProceso.ordinal()) {
				recorrido.add(e);
			}
		}
		if (etapa == Etapa.DESCARTADO) {
			recorrido.add(Etapa.DESCARTADO);
		}
		long minutos = Duration.between(creado, desde).toMinutes();
		for (int i = 0; i < recorrido.size(); i++) {
			boolean ultimo = i == recorrido.size() - 1;
			LocalDateTime fecha = i == 0 ? creado
					: ultimo ? desde : creado.plusMinutes(minutos * i / (recorrido.size() - 1));
			historial.save(HistorialEtapa.builder().candidato(c).etapaOrigen(i == 0 ? null : recorrido.get(i - 1))
					.etapaDestino(recorrido.get(i)).usuario(i == 0 ? null : reclutador).fecha(fecha)
					.comentario(i == 0 ? "Postulación recibida por el portal"
							: ultimo && motivo != null ? "Motivo: " + motivo : null)
					.build());
		}
	}
}

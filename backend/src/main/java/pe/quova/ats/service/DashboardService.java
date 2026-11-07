package pe.quova.ats.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.DashboardDto;
import pe.quova.ats.dto.Dtos.ReporteFilaDto;
import pe.quova.ats.dto.Dtos.ReportesDto;
import pe.quova.ats.dto.Dtos.SerieDto;
import pe.quova.ats.dto.Dtos.TarjetaDto;
import pe.quova.ats.model.Candidato;
import pe.quova.ats.model.Enums.EstadoVacante;
import pe.quova.ats.model.Enums.Fuente;
import pe.quova.ats.model.Etapa;
import pe.quova.ats.model.HistorialEtapa;
import pe.quova.ats.model.Tienda;
import pe.quova.ats.model.Vacante;
import pe.quova.ats.repo.CandidatoRepository;
import pe.quova.ats.repo.HistorialEtapaRepository;
import pe.quova.ats.repo.TiendaRepository;
import pe.quova.ats.repo.VacanteRepository;
import pe.quova.ats.security.UsuarioActual;

/**
 * Indicadores calculados con los datos reales de la BD. Se comparan los últimos 30 días con los 30 anteriores
 * (ventana móvil) para que el tablero tenga sentido cualquier día del mes.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

	private static final int DIAS = 30;
	private static final Map<Etapa, String> ETIQUETAS = etiquetas();

	private final VacanteRepository vacantes;
	private final CandidatoRepository candidatos;
	private final HistorialEtapaRepository historial;
	private final TiendaRepository tiendas;

	@Transactional(readOnly = true)
	public DashboardDto resumen(UsuarioActual u) {
		Long tienda = u.tiendaRestringida();
		LocalDateTime ahora = LocalDateTime.now();
		LocalDateTime inicio = ahora.minusDays(DIAS);
		LocalDateTime inicioPrevio = ahora.minusDays(2L * DIAS);

		List<Vacante> vs = vacantes.buscarTodasConDetalle().stream()
				.filter(v -> tienda == null || esDeTienda(v, tienda)).toList();
		List<Candidato> cs = candidatos.buscarTodosConDetalle().stream()
				.filter(c -> tienda == null || esDeTienda(c.getVacante(), tienda)).toList();
		List<HistorialEtapa> contrataciones = historial.buscarPorEtapaDestino(Etapa.CONTRATADO).stream()
				.filter(h -> tienda == null || esDeTienda(h.getCandidato().getVacante(), tienda)).toList();

		List<TarjetaDto> tarjetas = new ArrayList<>();

		// 1. Vacantes abiertas: menos vacantes sin cubrir es favorable.
		long abiertas = vs.stream().filter(v -> v.getEstado() == EstadoVacante.ABIERTA).count();
		long abiertasAntes = vs.stream().filter(v -> v.getPublicadaEn() != null && !v.getPublicadaEn().isAfter(inicio)
				&& (v.getCerradaEn() == null || v.getCerradaEn().isAfter(inicio))).count();
		tarjetas.add(tarjeta("vacantesAbiertas", "Vacantes abiertas", String.valueOf(abiertas),
				abiertas - abiertasAntes, "", false, "frente a hace 30 días"));

		// 2. Candidatos activos: más postulaciones recibidas es favorable.
		long activos = cs.stream().filter(c -> !c.getEtapa().esFinal()).count();
		long nuevos = cs.stream().filter(c -> !c.getCreadoEn().isBefore(inicio)).count();
		long nuevosAntes = cs.stream().filter(c -> entre(c.getCreadoEn(), inicioPrevio, inicio)).count();
		tarjetas.add(tarjeta("candidatosActivos", "Candidatos activos", String.valueOf(activos), nuevos - nuevosAntes,
				" postulaciones", true, "recibidas frente al periodo anterior"));

		// 3. Tiempo promedio de contratación (postulación -> contratado): menos días es favorable.
		OptionalDouble tiempo = diasPromedio(contrataciones, inicio, ahora.plusSeconds(1));
		OptionalDouble tiempoAntes = diasPromedio(contrataciones, inicioPrevio, inicio);
		long difTiempo = tiempo.isPresent() && tiempoAntes.isPresent()
				? Math.round(tiempo.getAsDouble()) - Math.round(tiempoAntes.getAsDouble())
				: 0;
		tarjetas.add(tarjeta("tiempoContratacion", "Tiempo promedio de contratación",
				tiempo.isPresent() ? Math.round(tiempo.getAsDouble()) + " días" : "Sin datos", difTiempo, " días",
				false, "frente al periodo anterior"));

		// 4. Contratados en el periodo: más es favorable.
		long contratados = contrataciones.stream().filter(h -> !h.getFecha().isBefore(inicio)).count();
		long contratadosAntes = contrataciones.stream().filter(h -> entre(h.getFecha(), inicioPrevio, inicio)).count();
		tarjetas.add(tarjeta("contratados", "Contratados este mes", String.valueOf(contratados),
				contratados - contratadosAntes, "", true, "frente al periodo anterior"));

		// 5. Tasa de abandono: candidatos que dejaron el proceso; que baje es favorable aunque el signo sea negativo.
		long tasa = tasaAbandono(cs, inicio, ahora.plusSeconds(1));
		long tasaAntes = tasaAbandono(cs, inicioPrevio, inicio);
		tarjetas.add(tarjeta("tasaAbandono", "Tasa de abandono", tasa + " %", tasa - tasaAntes, " pts", false,
				"frente al periodo anterior"));

		Map<Etapa, Long> porEtapa = new LinkedHashMap<>();
		for (Etapa e : Etapa.values()) {
			if (e != Etapa.DESCARTADO) {
				porEtapa.put(e, 0L);
			}
		}
		cs.forEach(c -> porEtapa.computeIfPresent(c.getEtapa(), (e, n) -> n + 1));
		List<SerieDto> candidatosPorEtapa = porEtapa.entrySet().stream()
				.map(e -> new SerieDto(ETIQUETAS.get(e.getKey()), e.getValue())).toList();

		List<SerieDto> vacantesPorTienda = tiendas.findAllByOrderByNombreAsc().stream()
				.filter(Tienda::isActiva)
				.filter(t -> tienda == null || t.getId().equals(tienda))
				.map(t -> new SerieDto(t.getNombre(), vs.stream()
						.filter(v -> v.getEstado() == EstadoVacante.ABIERTA && esDeTienda(v, t.getId())).count()))
				.toList();

		return new DashboardDto(tarjetas, candidatosPorEtapa, vacantesPorTienda, "Últimos 30 días");
	}

	@Transactional(readOnly = true)
	public ReportesDto reportes(UsuarioActual u) {
		Long tienda = u.tiendaRestringida();
		List<Vacante> vs = vacantes.buscarTodasConDetalle().stream()
				.filter(v -> tienda == null || esDeTienda(v, tienda)).toList();
		List<Candidato> cs = candidatos.buscarTodosConDetalle().stream()
				.filter(c -> tienda == null || esDeTienda(c.getVacante(), tienda)).toList();
		List<HistorialEtapa> contrataciones = historial.buscarPorEtapaDestino(Etapa.CONTRATADO).stream()
				.filter(h -> tienda == null || esDeTienda(h.getCandidato().getVacante(), tienda)).toList();

		Map<String, List<Double>> diasCargo = new HashMap<>();
		Map<String, List<Double>> diasTienda = new HashMap<>();
		for (HistorialEtapa h : contrataciones) {
			Vacante v = h.getCandidato().getVacante();
			double dias = Duration.between(h.getCandidato().getCreadoEn(), h.getFecha()).toHours() / 24.0;
			diasCargo.computeIfAbsent(v.getCargo().getNombre(), k -> new ArrayList<>()).add(dias);
			if (v.getTienda() != null) {
				diasTienda.computeIfAbsent(v.getTienda().getNombre(), k -> new ArrayList<>()).add(dias);
			}
		}

		List<ReporteFilaDto> porFuente = new ArrayList<>();
		for (Fuente fuente : Fuente.values()) {
			List<Candidato> grupo = cs.stream().filter(c -> c.getFuente() == fuente).toList();
			porFuente.add(new ReporteFilaDto(fuente.name(), grupo.size(), contratados(grupo), null, null));
		}

		Map<String, Long> abiertas = new LinkedHashMap<>();
		tiendas.findAllByOrderByNombreAsc().stream().filter(Tienda::isActiva)
				.filter(t -> tienda == null || t.getId().equals(tienda))
				.forEach(t -> abiertas.put(t.getNombre(), vs.stream()
						.filter(v -> v.getEstado() == EstadoVacante.ABIERTA && esDeTienda(v, t.getId())).count()));

		return new ReportesDto(porFuente, filas(cs, c -> c.getVacante().getCargo().getNombre(), diasCargo, Map.of()),
				filas(cs, c -> c.getVacante().getTienda() != null ? c.getVacante().getTienda().getNombre() : null,
						diasTienda, abiertas));
	}

	private static List<ReporteFilaDto> filas(List<Candidato> cs, java.util.function.Function<Candidato, String> clave,
			Map<String, List<Double>> dias, Map<String, Long> abiertas) {
		Map<String, long[]> conteo = new LinkedHashMap<>();
		for (String nombre : abiertas.keySet()) {
			conteo.put(nombre, new long[] { 0, 0 });
		}
		for (Candidato c : cs) {
			String nombre = clave.apply(c);
			if (nombre == null) {
				continue;
			}
			long[] n = conteo.computeIfAbsent(nombre, k -> new long[] { 0, 0 });
			n[0]++;
			if (c.getEtapa() == Etapa.CONTRATADO) {
				n[1]++;
			}
		}
		return conteo.entrySet().stream()
				.sorted(Comparator.<Map.Entry<String, long[]>>comparingLong(e -> e.getValue()[0]).reversed()
						.thenComparing(Map.Entry::getKey))
				.map(e -> new ReporteFilaDto(e.getKey(), e.getValue()[0], e.getValue()[1], promedio(dias.get(e.getKey())),
						abiertas.get(e.getKey())))
				.toList();
	}

	private static long contratados(List<Candidato> grupo) {
		return grupo.stream().filter(c -> c.getEtapa() == Etapa.CONTRATADO).count();
	}

	private static Long promedio(List<Double> dias) {
		if (dias == null || dias.isEmpty()) {
			return null;
		}
		return Math.round(dias.stream().mapToDouble(Double::doubleValue).average().orElse(0));
	}

	/**
	 * @param masEsMejor indica hacia dónde conviene que se mueva el indicador; el color sale de ahí y no del signo.
	 */
	private static TarjetaDto tarjeta(String clave, String titulo, String valor, long diferencia, String unidad,
			boolean masEsMejor, String detalle) {
		Boolean favorable = diferencia == 0 ? null : (diferencia > 0) == masEsMejor;
		String variacion = diferencia == 0 ? "Sin cambios" : (diferencia > 0 ? "+" : "−") + Math.abs(diferencia)
				+ unidad;
		return new TarjetaDto(clave, titulo, valor, variacion, favorable, detalle);
	}

	private static OptionalDouble diasPromedio(List<HistorialEtapa> contrataciones, LocalDateTime desde,
			LocalDateTime hasta) {
		return contrataciones.stream().filter(h -> entre(h.getFecha(), desde, hasta))
				.mapToDouble(h -> Duration.between(h.getCandidato().getCreadoEn(), h.getFecha()).toHours() / 24.0)
				.average();
	}

	/** Porcentaje de las postulaciones del periodo que terminaron por abandono del candidato. */
	private static long tasaAbandono(List<Candidato> cs, LocalDateTime desde, LocalDateTime hasta) {
		List<Candidato> periodo = cs.stream().filter(c -> entre(c.getCreadoEn(), desde, hasta)).toList();
		if (periodo.isEmpty()) {
			return 0;
		}
		long abandonos = periodo.stream()
				.filter(c -> c.getMotivoDescarte() != null && c.getMotivoDescarte().esAbandono()).count();
		return Math.round(abandonos * 100.0 / periodo.size());
	}

	private static boolean entre(LocalDateTime fecha, LocalDateTime desde, LocalDateTime hasta) {
		return !fecha.isBefore(desde) && fecha.isBefore(hasta);
	}

	private static boolean esDeTienda(Vacante v, Long tiendaId) {
		return v.getTienda() != null && tiendaId.equals(v.getTienda().getId());
	}

	private static Map<Etapa, String> etiquetas() {
		Map<Etapa, String> m = new LinkedHashMap<>();
		m.put(Etapa.NUEVO, "Nuevo");
		m.put(Etapa.PRESELECCIONADO, "Preseleccionado");
		m.put(Etapa.ENTREVISTA, "Entrevista");
		m.put(Etapa.PRUEBA, "Prueba");
		m.put(Etapa.OFERTA, "Oferta");
		m.put(Etapa.CONTRATADO, "Contratado");
		return m;
	}
}

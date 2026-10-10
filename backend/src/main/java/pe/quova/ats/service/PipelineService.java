package pe.quova.ats.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.CandidatoDto;
import pe.quova.ats.dto.Dtos.DescartarRequest;
import pe.quova.ats.dto.Dtos.HistorialDto;
import pe.quova.ats.error.ApiException;
import pe.quova.ats.model.Candidato;
import pe.quova.ats.model.Etapa;
import pe.quova.ats.model.HistorialEtapa;
import pe.quova.ats.model.Vacante;
import pe.quova.ats.repo.CandidatoRepository;
import pe.quova.ats.repo.HistorialEtapaRepository;
import pe.quova.ats.repo.UsuarioRepository;
import pe.quova.ats.security.UsuarioActual;

@Service
@RequiredArgsConstructor
public class PipelineService {

	private final CandidatoRepository candidatos;
	private final HistorialEtapaRepository historial;
	private final UsuarioRepository usuarios;

	@Transactional(readOnly = true)
	public List<CandidatoDto> listar(Long vacanteId, Long tiendaId, UsuarioActual u) {
		Long restringida = u.tiendaRestringida();
		return candidatos.buscarTodosConDetalle().stream()
				.filter(c -> restringida == null || esDeTienda(c.getVacante(), restringida))
				.filter(c -> tiendaId == null || esDeTienda(c.getVacante(), tiendaId))
				.filter(c -> vacanteId == null || vacanteId.equals(c.getVacante().getId()))
				.map(PipelineService::aDto)
				.toList();
	}

	/** Regla 2: un candidato solo avanza; cada cambio queda en historial_etapa. */
	@Transactional
	public CandidatoDto mover(Long id, Etapa destino, UsuarioActual u) {
		Candidato c = buscar(id);
		Etapa origen = c.getEtapa();
		if (!origen.puedeAvanzarA(destino)) {
			throw new ApiException(HttpStatus.CONFLICT, "MOVIMIENTO_NO_PERMITIDO", motivoBloqueo(origen, destino))
					.conDato("etapaActual", origen);
		}
		cambiarEtapa(c, destino, u, null);
		return aDto(c);
	}

	/** Regla 4: todo descarte exige un motivo y puede guardar al candidato en el banco de talento. */
	@Transactional
	public CandidatoDto descartar(Long id, DescartarRequest req, UsuarioActual u) {
		Candidato c = buscar(id);
		if (c.getEtapa().esFinal()) {
			throw new ApiException(HttpStatus.CONFLICT, "MOVIMIENTO_NO_PERMITIDO",
					"El candidato ya está en una etapa final y no se puede descartar.")
					.conDato("etapaActual", c.getEtapa());
		}
		String comentario = req.comentario() == null || req.comentario().isBlank() ? null : req.comentario().trim();
		c.setMotivoDescarte(req.motivo());
		c.setComentarioDescarte(comentario);
		c.setBancoTalento(req.bancoTalento());
		cambiarEtapa(c, Etapa.DESCARTADO, u, "Motivo: " + req.motivo() + (comentario != null ? ". " + comentario : ""));
		return aDto(c);
	}

	@Transactional(readOnly = true)
	public List<HistorialDto> historial(Long id) {
		buscar(id);
		return historial.buscarPorCandidato(id).stream()
				.map(h -> new HistorialDto(h.getFecha(), h.getEtapaOrigen(), h.getEtapaDestino(),
						h.getUsuario() != null ? h.getUsuario().getNombre() : "Portal de postulación",
						h.getComentario()))
				.toList();
	}

	private void cambiarEtapa(Candidato c, Etapa destino, UsuarioActual u, String comentario) {
		LocalDateTime ahora = LocalDateTime.now();
		historial.save(HistorialEtapa.builder().candidato(c).etapaOrigen(c.getEtapa()).etapaDestino(destino)
				.usuario(usuarios.getReferenceById(u.id())).fecha(ahora).comentario(comentario).build());
		c.setEtapa(destino);
		c.setEtapaDesde(ahora);
	}

	private Candidato buscar(Long id) {
		return candidatos.buscarConDetalle(id).orElseThrow(() -> ApiException.noEncontrado("El candidato no existe."));
	}

	private static String motivoBloqueo(Etapa origen, Etapa destino) {
		if (origen.esFinal()) {
			return "El candidato ya está en una etapa final y no se puede mover.";
		}
		if (destino == Etapa.DESCARTADO) {
			return "Para descartar usa la acción «Descartar» e indica el motivo.";
		}
		if (destino == origen) {
			return "El candidato ya se encuentra en esa etapa.";
		}
		return "Un candidato no puede volver a una etapa anterior.";
	}

	private static boolean esDeTienda(Vacante v, Long tiendaId) {
		return v.getTienda() != null && tiendaId.equals(v.getTienda().getId());
	}

	static CandidatoDto aDto(Candidato c) {
		Vacante v = c.getVacante();
		long dias = Math.max(0, ChronoUnit.DAYS.between(c.getEtapaDesde().toLocalDate(), LocalDate.now()));
		return new CandidatoDto(c.getId(), c.getNombre(), c.getCelular(), v.getId(), v.getTitulo(),
				v.getTienda() != null ? v.getTienda().getId() : null,
				v.getTienda() != null ? v.getTienda().getNombre() : null, v.getCargo().getNombre(), c.getFuente(),
				c.getEtapa(), dias, c.getEtapaDesde(), c.getCreadoEn(), c.isBancoTalento(), c.getMotivoDescarte());
	}
}

package pe.quova.ats.service;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.EntrevistaDto;
import pe.quova.ats.dto.Dtos.EntrevistaRequest;
import pe.quova.ats.dto.Dtos.EvaluacionRequest;
import pe.quova.ats.error.ApiException;
import pe.quova.ats.model.Candidato;
import pe.quova.ats.model.Entrevista;
import pe.quova.ats.model.Enums.EstadoEntrevista;
import pe.quova.ats.model.Vacante;
import pe.quova.ats.repo.CandidatoRepository;
import pe.quova.ats.repo.EntrevistaRepository;
import pe.quova.ats.security.UsuarioActual;

@Service
@RequiredArgsConstructor
public class EntrevistaService {

	private final EntrevistaRepository entrevistas;
	private final CandidatoRepository candidatos;
	private final AvisoService avisos;

	@Transactional(readOnly = true)
	public List<EntrevistaDto> listar(UsuarioActual u) {
		Long tienda = u.tiendaRestringida();
		return entrevistas.buscarTodas().stream().filter(e -> tienda == null || tienda.equals(tiendaDe(e)))
				.map(EntrevistaService::aDto).toList();
	}

	@Transactional
	public EntrevistaDto crear(EntrevistaRequest req) {
		Candidato c = candidatos.buscarConDetalle(req.candidatoId())
				.orElseThrow(() -> ApiException.noEncontrado("El candidato no existe."));
		if (c.getEtapa().esFinal()) {
			throw new ApiException(HttpStatus.CONFLICT, "CANDIDATO_FUERA_DE_PROCESO",
					"Este candidato ya no está en proceso.");
		}
		if (entrevistas.existsByCandidatoIdAndEstado(c.getId(), EstadoEntrevista.PENDIENTE)) {
			throw new ApiException(HttpStatus.CONFLICT, "ENTREVISTA_PENDIENTE",
					"Este candidato ya tiene una entrevista pendiente.");
		}
		Entrevista e = entrevistas.save(Entrevista.builder().candidato(c).fechaHora(req.fechaHora()).build());
		avisos.registrar("Entrevista agendada para " + c.getNombre() + " el "
				+ req.fechaHora().format(DateTimeFormatter.ofPattern("dd/MM HH:mm")) + ".", tiendaDe(c.getVacante()));
		return aDto(e);
	}

	@Transactional
	public EntrevistaDto evaluar(Long id, EvaluacionRequest req, UsuarioActual u) {
		Entrevista e = entrevistas.findById(id).orElseThrow(() -> ApiException.noEncontrado("La entrevista no existe."));
		if (u.rol() != pe.quova.ats.model.Enums.Rol.JEFE_TIENDA || u.tiendaRestringida() == null
				|| !u.tiendaRestringida().equals(tiendaDe(e))) {
			throw ApiException.sinPermiso("Solo el jefe de esa tienda puede evaluar la entrevista.");
		}
		if (e.getEstado() != EstadoEntrevista.PENDIENTE) {
			throw new ApiException(HttpStatus.CONFLICT, "ENTREVISTA_YA_EVALUADA", "Esta entrevista ya fue evaluada.");
		}
		e.setEstado(EstadoEntrevista.COMPLETADA);
		e.setResultado(req.resultado());
		e.setEstrellas(req.estrellas());
		String resultado = req.resultado() == pe.quova.ats.model.Enums.ResultadoEntrevista.APROBADO ? "Aprobado" : "En espera";
		avisos.registrar("Evaluación de " + e.getCandidato().getNombre() + ": " + resultado + ".", tiendaDe(e));
		return aDto(e);
	}

	private static Long tiendaDe(Entrevista e) {
		return tiendaDe(e.getCandidato().getVacante());
	}

	private static Long tiendaDe(Vacante v) {
		return v.getTienda() != null ? v.getTienda().getId() : null;
	}

	private static EntrevistaDto aDto(Entrevista e) {
		Candidato c = e.getCandidato();
		Vacante v = c.getVacante();
		return new EntrevistaDto(e.getId(), c.getId(), c.getNombre(), v.getCargo().getNombre(),
				v.getTienda() != null ? v.getTienda().getId() : null,
				v.getTienda() != null ? v.getTienda().getNombre() : null, e.getFechaHora(), e.getEstado(),
				e.getResultado(), e.getEstrellas());
	}
}

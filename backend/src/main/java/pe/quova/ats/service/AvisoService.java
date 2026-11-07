package pe.quova.ats.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.AvisoDto;
import pe.quova.ats.model.Aviso;
import pe.quova.ats.repo.AvisoRepository;
import pe.quova.ats.security.UsuarioActual;

@Service
@RequiredArgsConstructor
public class AvisoService {

	private final AvisoRepository avisos;

	@Transactional
	public void registrar(String mensaje, Long tiendaId) {
		avisos.save(Aviso.builder().mensaje(mensaje).tiendaId(tiendaId).creadoEn(java.time.LocalDateTime.now()).build());
	}

	@Transactional(readOnly = true)
	public List<AvisoDto> listar(UsuarioActual u) {
		Long tienda = u.tiendaRestringida();
		List<Aviso> lista = tienda == null ? avisos.findTop20ByOrderByCreadoEnDesc()
				: avisos.findTop20ByTiendaIdOrderByCreadoEnDesc(tienda);
		return lista.stream().map(a -> new AvisoDto(a.getId(), a.getMensaje(), a.getCreadoEn())).toList();
	}
}

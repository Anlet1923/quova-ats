package pe.quova.ats.model;

/** Enumeraciones pequeñas del dominio. */
public final class Enums {

	private Enums() {
	}

	public enum Rol {
		ADMIN, RECLUTADOR, JEFE_TIENDA, GERENTE_REGIONAL
	}

	public enum EstadoVacante {
		BORRADOR, ABIERTA, CERRADA
	}

	public enum Turno {
		MANANA, TARDE, ROTATIVO, FIN_DE_SEMANA
	}

	public enum DisponibilidadInicio {
		INMEDIATA, UNA_SEMANA, DOS_SEMANAS, UN_MES
	}

	public enum Fuente {
		WEB_QUOVA, LINKEDIN, COMPUTRABAJO, BUMERAN, REFERIDO;

		public static Fuente desde(String valor) {
			if (valor != null) {
				for (Fuente f : values()) {
					if (f.name().equalsIgnoreCase(valor.trim())) {
						return f;
					}
				}
			}
			return WEB_QUOVA;
		}
	}

	public enum MotivoDescarte {
		NO_CUMPLE_PERFIL(false), NO_DISPONIBILIDAD_TURNO(false), PRETENSION_SALARIAL(false),
		NO_ASISTIO_ENTREVISTA(true), DESISTIO(true), NO_RESPONDE(true), OTRO(false);

		private final boolean abandono;

		MotivoDescarte(boolean abandono) {
			this.abandono = abandono;
		}

		/** Indica que fue el candidato quien dejó el proceso (cuenta para la tasa de abandono). */
		public boolean esAbandono() {
			return abandono;
		}
	}
}

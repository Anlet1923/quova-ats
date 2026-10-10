package pe.quova.ats.model;

/** Etapas del pipeline, en el orden en que se recorren. */
public enum Etapa {
	NUEVO, PRESELECCIONADO, ENTREVISTA, PRUEBA, OFERTA, CONTRATADO, DESCARTADO;

	public boolean esFinal() {
		return this == CONTRATADO || this == DESCARTADO;
	}

	/** Un candidato solo avanza: nunca vuelve a una etapa anterior ni se queda en la misma. */
	public boolean puedeAvanzarA(Etapa destino) {
		return destino != null && !esFinal() && destino != DESCARTADO && destino.ordinal() > ordinal();
	}
}

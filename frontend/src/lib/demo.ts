export const PLANTILLAS_DEMO: { nombre: string; canal: string; momento: string; mensaje: string }[] = [
  {
    nombre: 'Confirmación de postulación',
    canal: 'WhatsApp',
    momento: 'Al recibir la postulación',
    mensaje: 'Hola {nombre}, recibimos tu postulación a {cargo} en Quova {tienda}. Te escribiremos si tu perfil avanza.',
  },
  {
    nombre: 'Cita a entrevista',
    canal: 'WhatsApp y correo',
    momento: 'Al agendar la entrevista',
    mensaje: 'Hola {nombre}, te esperamos el {fecha} a las {hora} en Quova {tienda} para tu entrevista. Responde SÍ para confirmar.',
  },
  {
    nombre: 'Resultado del proceso',
    canal: 'WhatsApp',
    momento: 'Al cerrar la evaluación',
    mensaje: 'Hola {nombre}, gracias por participar en el proceso de {cargo}. Ya tenemos el resultado de tu evaluación: {resultado}.',
  },
  {
    nombre: 'Bienvenida',
    canal: 'Correo',
    momento: 'Al pasar a «Contratado»',
    mensaje: '¡Bienvenido(a) a Quova, {nombre}! Tu primer día es el {fecha} en la tienda {tienda}. Pregunta por {jefe}.',
  },
];

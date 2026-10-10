# Quova ATS

Sistema web de reclutamiento para las tiendas de Quova (moda y calzado).

- **Backend:** Java 17, Spring Boot 3.5, Spring Data JPA, Spring Security con JWT, H2.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS.

## Requisitos

| Herramienta | Versión |
|---|---|
| JDK | 17 o superior |
| Node.js | 18 o superior |

No hace falta instalar Maven ni un motor de base de datos.

## Pasos para ejecutar (Windows, PowerShell)

Se usan dos terminales.

**1. Backend** (http://localhost:8080)

```powershell
cd backend
.\mvnw spring-boot:run
```

Está listo cuando aparece `Started QuovaAtsApplication`. La primera vez tarda unos minutos porque descarga las dependencias.

**2. Frontend** (http://localhost:5173)

```powershell
cd frontend
npm install
npm run dev
```

`npm install` solo es necesario la primera vez.

**3. Abrir la aplicación**

Entra a http://localhost:5173 e inicia sesión con uno de los usuarios de prueba.

## Usuarios de prueba

Contraseña de todos: `Quova2026!`

| Correo | Rol |
|---|---|
| `reclutador@quova.pe` | Reclutador(a) de RR. HH. |
| `admin@quova.pe` | Administrador |
| `jefe.miraflores@quova.pe` | Jefe de tienda |
| `gerente@quova.pe` | Gerente regional |

Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos.

Para probar el portal del candidato (no requiere cuenta): http://localhost:5173/postular/demo-vend-mira

## Conexión a la base de datos

La base es H2 en modo archivo. Se crea sola en `backend/data/quova.mv.db` al iniciar el backend por primera vez, con datos de prueba.

| Dato | Valor |
|---|---|
| Usuario | `sa` |
| Contraseña | *(vacía)* |
| Driver | `org.h2.Driver` |

### Desde el navegador (consola H2)

1. Con el backend en ejecución, abre http://localhost:8080/h2-console
2. En **JDBC URL** escribe `jdbc:h2:file:./data/quova`
3. Usuario `sa`, contraseña vacía.
4. Pulsa **Connect**.

### Desde DBeaver

1. **Database → New Database Connection → H2 Embedded (V.2)**.
2. En **Connect by** elige **URL** y escribe la ruta completa al archivo, sin la extensión `.mv.db`:

   ```
   jdbc:h2:file:C:/ruta/al/proyecto/quova-ats/backend/data/quova;AUTO_SERVER=TRUE
   ```

3. Usuario `sa`, contraseña vacía.
4. **Test Connection** y luego **Finish**.

`AUTO_SERVER=TRUE` permite conectarse mientras el backend está en ejecución.

### Tablas

| Tabla | Contenido |
|---|---|
| `USUARIO` | Usuarios del panel y su rol |
| `TIENDA` | Tiendas de la cadena |
| `CARGO` | Cargos con su salario base |
| `VACANTE` | Vacantes y su link de postulación |
| `CANDIDATO` | Postulaciones y etapa actual |
| `CANDIDATO_TURNO` | Turnos elegidos por cada candidato |
| `HISTORIAL_ETAPA` | Cambios de etapa de cada candidato |

### Usar MySQL (opcional)

Con MySQL 8 en `localhost:3306`:

```powershell
cd backend
$env:QUOVA_DB_USER = "root"
$env:QUOVA_DB_PASSWORD = "tu-clave"
.\mvnw spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

La base `quova_ats` se crea sola.

## Otros pasos útiles

**Reiniciar los datos de prueba.** Detén el backend (Ctrl+C) y ejecuta desde la raíz del proyecto:

```powershell
.\reiniciar-datos.ps1
```

**Documentación de la API.** http://localhost:8080/swagger-ui.html. Ejecuta `POST /api/auth/login`, copia el `token` y pégalo en **Authorize**.

**Pruebas del backend.**

```powershell
cd backend
.\mvnw test
```

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| Error `class file version 61.0` al iniciar el backend | La terminal usa un Java anterior al 17. Ejecuta `.\iniciar-backend.cmd` desde la raíz o define `JAVA_HOME` hacia un JDK 17 |
| `Port 8080 was already in use` | Cierra el backend que quedó abierto |
| `Port 5173 is in use` | Cierra la otra terminal con `npm run dev` |
| «No pudimos conectar con el servidor» | El backend no está en ejecución |

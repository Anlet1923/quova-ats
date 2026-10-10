package pe.quova.ats.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI quovaOpenApi() {
		return new OpenAPI()
				.info(new Info().title("Quova ATS API").version("0.4.0").description(
						"API del avance 40 %: autenticación, portal de postulación, vacantes, pipeline y dashboard. "
								+ "Usa POST /api/auth/login y pega el token en «Authorize»."))
				.components(new Components().addSecuritySchemes("bearer",
						new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
				.addSecurityItem(new SecurityRequirement().addList("bearer"));
	}
}

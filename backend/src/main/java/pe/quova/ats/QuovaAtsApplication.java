package pe.quova.ats;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class QuovaAtsApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuovaAtsApplication.class, args);
	}

}

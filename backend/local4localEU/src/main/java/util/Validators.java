package util;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

public class Validators {

    public static boolean isValidUrl(String url) {
        String regexPattern = "^https://[^\s/$.?#].[^\s]*$";

        return Pattern.compile(regexPattern, Pattern.CASE_INSENSITIVE)
                .matcher(url)
                .matches();
    }

    public static boolean isTokenValid(LocalDateTime expirationDate) {
        return Optional.ofNullable(expirationDate)
                .map(date -> date.isAfter(LocalDateTime.now())).orElse(false);
    }
}

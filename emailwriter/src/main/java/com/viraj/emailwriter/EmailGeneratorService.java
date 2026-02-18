package com.viraj.emailwriter;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;
    private final String apiKey;

    public EmailGeneratorService(WebClient.Builder webClientBuilder,
                                 @Value("${gemini.api.key}") String geminiApiKey,
                                 @Value("${gemini.api.url}") String baseUrl) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
        this.apiKey = geminiApiKey;
    }

    public String generateEmailReplay(EmailRequest emailRequest) {

        String prompt = buildPrompt(emailRequest);

        String requestBody= String.format("""
                {
                    "contents": [
                      {
                        "parts": [
                          {
                            "text": "%s"
                          }
                        ]
                      }
                    ]
                  }
                """, prompt);



        String response = webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/models/gemini-2.5-flash:generateContent")
                        .build())
                .header("x-goog-api-key", apiKey)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(
                        status -> status.value() == 429,
                        res -> Mono.error(new RuntimeException("Gemini rate limit exceeded"))
                )
                .onStatus(
                        HttpStatusCode::is4xxClientError,
                        res -> Mono.error(new RuntimeException("Bad request to Gemini API"))
                )
                .bodyToMono(String.class)
                .block();

        //Extract Response
        return extractResponseContent(response);

    }


    private String extractResponseContent(String response) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(response);
            return root.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String buildPrompt(EmailRequest emailRequest) {

        StringBuilder stringBuilder = new StringBuilder();

        stringBuilder.append("Generate a reply email for following content without subject:");

        if(emailRequest.getTone() != null && !emailRequest.getTone().isEmpty()) {
            stringBuilder.append("Use a").append(emailRequest.getTone()).append("tone.");
        }

        stringBuilder.append("Original email \n").append(emailRequest.getEmailContent())
                     .append("one best option");
        return stringBuilder.toString();
    }


}

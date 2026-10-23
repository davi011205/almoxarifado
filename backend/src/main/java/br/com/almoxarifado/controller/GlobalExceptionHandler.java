package br.com.almoxarifado.controller;

import br.com.almoxarifado.dto.ApiDtos;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiDtos.ErrorDto> status(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        return ResponseEntity.status(status).body(error(exception.getReason() == null ? status.getReasonPhrase() : exception.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiDtos.ErrorDto> validation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .distinct().collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(error(message.isBlank() ? "Dados inválidos." : message));
    }

    @ExceptionHandler({ConstraintViolationException.class, HttpMessageNotReadableException.class, IllegalArgumentException.class})
    public ResponseEntity<ApiDtos.ErrorDto> badRequest(Exception exception) {
        return ResponseEntity.badRequest().body(error("Requisição inválida. Confira os dados informados."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiDtos.ErrorDto> conflict(DataIntegrityViolationException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error("Já existe um registro com os mesmos dados ou há uma referência em uso."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiDtos.ErrorDto> serverError(Exception exception) {
        // Detalhes internos não são enviados ao cliente para não expor informações do banco.
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("Erro interno no servidor. Consulte os logs da API."));
    }

    private ApiDtos.ErrorDto error(String message) {
        return new ApiDtos.ErrorDto(message, Instant.now());
    }
}

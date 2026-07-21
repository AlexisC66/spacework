package com.spacework.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import jakarta.validation.ConstraintViolationException;
import java.time.format.DateTimeParseException;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex, jakarta.servlet.http.HttpServletRequest request) {
        logger.error("Método no soportado: {} {} - Soportados: {}", ex.getMethod(), request.getRequestURI(), ex.getSupportedHttpMethods());
        ErrorResponse errorResponse = new ErrorResponse(
            "Método '" + ex.getMethod() + "' no soportado para esta ruta. Métodos permitidos: " + ex.getSupportedHttpMethods(),
            "METHOD_NOT_ALLOWED");
        return new ResponseEntity<>(errorResponse, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(Throwable.class)
    public ResponseEntity<ErrorResponse> handleAllThrowables(Throwable ex) {
        logger.error("Error interno del servidor: ", ex);
        ErrorResponse errorResponse = new ErrorResponse("Error interno del servidor.", "INTERNAL_SERVER_ERROR");
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.warn("Argumento inválido: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "BAD_REQUEST");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ex) {
        logger.warn("Estado inválido: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), "BAD_REQUEST");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        logger.warn("Validación fallida: {}", errorMsg);
        ErrorResponse errorResponse = new ErrorResponse(errorMsg, "VALIDATION_ERROR");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        logger.warn("Petición JSON malformada: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse("El formato de los datos enviados es incorrecto o está incompleto.", "MALFORMED_JSON_REQUEST");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        String errorMsg = ex.getConstraintViolations().stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .collect(Collectors.joining(", "));
        logger.warn("Violación de restricciones: {}", errorMsg);
        ErrorResponse errorResponse = new ErrorResponse(errorMsg, "CONSTRAINT_VIOLATION");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<ErrorResponse> handleDateTimeParseException(DateTimeParseException ex) {
        logger.warn("Formato de fecha inválido: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse("Formato de fecha inválido. Use ISO_LOCAL_DATE_TIME (ej: 2026-07-03T00:00:00)", "BAD_REQUEST");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        logger.warn("Conflicto de concurrencia: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse("La operación no pudo completarse debido a un conflicto de concurrencia. Intente nuevamente.", "CONCURRENCY_CONFLICT");
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }
}

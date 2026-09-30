package com.shop.shopbackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> handleRuntimeException(RuntimeException exception) {
        return Map.of(
                "message",
                exception.getMessage()
        );
    }
}
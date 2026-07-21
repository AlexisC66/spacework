package com.spacework.core.security;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Service
public class LoginAttemptService {

    private final int maxAttempts;
    private final LoadingCache<String, Integer> attemptsCache;

    public LoginAttemptService(@Value("${login.max-attempts:3}") int maxAttempts,
                               @Value("${login.block-minutes:15}") int blockMinutes) {
        this.maxAttempts = maxAttempts;
        this.attemptsCache = CacheBuilder.newBuilder()
                .expireAfterWrite(blockMinutes, TimeUnit.MINUTES)
                .build(new CacheLoader<String, Integer>() {
                    @Override
                    public Integer load(String key) {
                        return 0;
                    }
                });
    }

    public void loginSucceeded(String key) {
        attemptsCache.invalidate(key);
    }

    public void loginFailed(String key) {
        int attempts = 0;
        try {
            attempts = attemptsCache.get(key);
        } catch (ExecutionException e) {
            attempts = 0;
        }
        attempts++;
        attemptsCache.put(key, attempts);
    }

    public boolean isBlocked(String key) {
        try {
            return attemptsCache.get(key) >= maxAttempts;
        } catch (ExecutionException e) {
            return false;
        }
    }
}

package com.spacework.reservations.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import org.springframework.scheduling.annotation.Async;

import java.util.Date;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    /** El correo desde el que se envían los mensajes (configurado en application.properties) */
    @Value("${spring.mail.username}")
    private String fromEmail;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Envía un correo en texto plano.
     */
    @Async
    public void sendEmail(String to, String subject, String body) {
        logger.info("Preparando envío de correo a: {} con asunto: '{}'", to, subject);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom(fromEmail != null ? fromEmail : "noreply@spacework.com");

            mailSender.send(message);
            logger.info("Correo enviado exitosamente a {}", to);
        } catch (Exception e) {
            logger.warn("No se pudo enviar el correo a {}: {}", to, e.getMessage());
        }
    }

    /**
     * Envía un correo en formato HTML con alternativa en texto plano.
     * Usa MIME multipart para que funcione en cualquier cliente de correo.
     */
    @Async
    public void enviarHtml(String destino, String asunto, String htmlBody, String plainTextBody) {
        logger.info("Preparando envío de correo HTML a: {} con asunto: '{}'", destino, asunto);
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setFrom(fromEmail != null ? fromEmail : "noreply@spacework.com", "SpaceWork");
            helper.setTo(destino);
            helper.setSubject(asunto);
            // Enviamos ambas versiones: texto plano y HTML
            helper.setText(plainTextBody, htmlBody);
            mensaje.setSentDate(new Date());
            mensaje.addHeader("X-Auto-Response-Suppress", "All");
            mensaje.addHeader("Auto-Submitted", "auto-generated");

            mailSender.send(mensaje);
            logger.info("Correo HTML enviado exitosamente a {}", destino);
        } catch (Exception e) {
            logger.warn("No se pudo enviar el correo HTML a {}: {}", destino, e.getMessage());
        }
    }
}

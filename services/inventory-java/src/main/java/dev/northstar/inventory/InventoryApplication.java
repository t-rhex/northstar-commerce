package dev.northstar.inventory;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@SpringBootApplication
public class InventoryApplication {
  public static void main(String[] args) { SpringApplication.run(InventoryApplication.class, args); }
}

record Item(String productId, int quantity) {}
record ReservationRequest(String transactionId, List<Item> items) {}
record Reservation(String id, String transactionId, String status, List<Item> items, Instant createdAt, Instant releasedAt) {}

@RestController
class InventoryController {
  private final JdbcClient jdbc;
  private final ObjectMapper mapper;
  private final long latencyMs;
  private final double failureRate;

  InventoryController(JdbcClient jdbc, ObjectMapper mapper, @org.springframework.beans.factory.annotation.Value("${SIMULATED_LATENCY_MS:450}") long latencyMs, @org.springframework.beans.factory.annotation.Value("${SIMULATED_FAILURE_RATE:0}") double failureRate) {
    this.jdbc = jdbc; this.mapper = mapper; this.latencyMs = latencyMs; this.failureRate = failureRate;
  }

  @GetMapping({"/health", "/health/live", "/health/ready"})
  Map<String, String> health() { jdbc.sql("SELECT 1").query(Integer.class).single(); return Map.of("service", "inventory-java", "status", "ready"); }

  @PostMapping("/reservations")
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  Reservation reserve(@RequestBody ReservationRequest request) throws Exception {
    if (request.transactionId() == null || request.transactionId().isBlank() || request.items() == null || request.items().isEmpty()) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "transactionId and items are required");
    Thread.sleep(latencyMs);
    if (Math.random() < failureRate) throw new ResponseStatusException(HttpStatus.CONFLICT, "Inventory simulation rejected the reservation");
    var existing = jdbc.sql("SELECT id, transaction_id, status, items::text, created_at, released_at FROM inventory.reservations WHERE transaction_id = :transactionId").param("transactionId", request.transactionId()).query((rs, row) -> mapReservation(rs.getString("id"), rs.getString("transaction_id"), rs.getString("status"), rs.getString("items"), rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("released_at") == null ? null : rs.getTimestamp("released_at").toInstant())).optional();
    if (existing.isPresent()) return existing.get();
    for (Item item : request.items()) {
      if (item.productId() == null || item.quantity() < 1) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Every item needs a productId and positive quantity");
      Integer available = jdbc.sql("SELECT available FROM inventory.stock WHERE product_id = :id FOR UPDATE").param("id", item.productId()).query(Integer.class).optional().orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Unknown inventory item " + item.productId()));
      if (available < item.quantity()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient inventory for " + item.productId());
      jdbc.sql("UPDATE inventory.stock SET available = available - :quantity, updated_at = now() WHERE product_id = :id").param("quantity", item.quantity()).param("id", item.productId()).update();
    }
    String id = "RSV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    Instant createdAt = Instant.now();
    jdbc.sql("INSERT INTO inventory.reservations (id, transaction_id, status, items, created_at) VALUES (:id, :transactionId, 'reserved', CAST(:items AS jsonb), :createdAt)").param("id", id).param("transactionId", request.transactionId()).param("items", mapper.writeValueAsString(request.items())).param("createdAt", createdAt.atOffset(ZoneOffset.UTC)).update();
    return new Reservation(id, request.transactionId(), "reserved", request.items(), createdAt, null);
  }

  @DeleteMapping("/reservations/{id}")
  @Transactional
  Reservation release(@PathVariable String id) {
    var row = jdbc.sql("SELECT id, transaction_id, status, items::text, created_at, released_at FROM inventory.reservations WHERE id = :id FOR UPDATE").param("id", id).query((rs, index) -> mapReservation(rs.getString("id"), rs.getString("transaction_id"), rs.getString("status"), rs.getString("items"), rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("released_at") == null ? null : rs.getTimestamp("released_at").toInstant())).optional().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
    if (!row.status().equals("reserved")) return row;
    row.items().forEach(item -> jdbc.sql("UPDATE inventory.stock SET available = available + :quantity, updated_at = now() WHERE product_id = :id").param("quantity", item.quantity()).param("id", item.productId()).update());
    Instant releasedAt = Instant.now();
    jdbc.sql("UPDATE inventory.reservations SET status = 'released', released_at = :releasedAt WHERE id = :id").param("releasedAt", releasedAt.atOffset(ZoneOffset.UTC)).param("id", id).update();
    return new Reservation(row.id(), row.transactionId(), "released", row.items(), row.createdAt(), releasedAt);
  }

  private Reservation mapReservation(String id, String transactionId, String status, String items, Instant createdAt, Instant releasedAt) {
    try { return new Reservation(id, transactionId, status, mapper.readValue(items, new TypeReference<List<Item>>() {}), createdAt, releasedAt); }
    catch (Exception error) { throw new IllegalStateException(error); }
  }
}

@RestControllerAdvice
class ApiErrors {
  @ExceptionHandler(ResponseStatusException.class)
  @ResponseStatus
  org.springframework.http.ResponseEntity<Map<String, Object>> responseStatus(ResponseStatusException error) {
    return org.springframework.http.ResponseEntity.status(error.getStatusCode()).body(Map.of("error", Map.of("code", error.getStatusCode().toString().replace(' ', '_'), "message", error.getReason() == null ? "Request rejected" : error.getReason())));
  }
}

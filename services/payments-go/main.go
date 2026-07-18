package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"math/rand/v2"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	tracesdk "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.37.0"
)

type service struct {
	db          *pgxpool.Pool
	latency     time.Duration
	failureRate float64
}

type authorizeRequest struct {
	TransactionID string `json:"transactionId"`
	Amount        float64 `json:"amount"`
	Customer      struct { Email string `json:"email"` } `json:"customer"`
}

type payment struct {
	ID            string     `json:"id"`
	TransactionID string     `json:"transactionId"`
	Amount        float64    `json:"amount"`
	Currency      string     `json:"currency"`
	Status        string     `json:"status"`
	Provider      string     `json:"provider"`
	CreatedAt     time.Time  `json:"createdAt"`
	VoidedAt      *time.Time `json:"voidedAt,omitempty"`
}

func main() {
	ctx := context.Background()
	shutdownTelemetry, err := setupTelemetry(ctx)
	if err != nil { panic(err) }
	defer shutdownTelemetry(context.Background())
	databaseURL := env("DATABASE_URL", "postgres://northstar:northstar-dev@localhost:5432/northstar?sslmode=disable")
	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil { panic(err) }
	defer db.Close()
	latency, _ := strconv.Atoi(env("SIMULATED_LATENCY_MS", "650"))
	failureRate, _ := strconv.ParseFloat(env("SIMULATED_FAILURE_RATE", "0"), 64)
	svc := &service{db: db, latency: time.Duration(latency) * time.Millisecond, failureRate: failureRate}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", svc.health)
	mux.HandleFunc("GET /health/live", svc.health)
	mux.HandleFunc("GET /health/ready", svc.health)
	mux.HandleFunc("POST /payments/authorize", svc.authorize)
	mux.HandleFunc("POST /payments/{id}/void", svc.void)
	server := &http.Server{Addr: ":" + env("PORT", "4006"), Handler: requestMiddleware(otelhttp.NewHandler(mux, "payments-go")), ReadHeaderTimeout: 3 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 30 * time.Second}
	go func() { slog.Info("payments service started", "port", env("PORT", "4006")); if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) { panic(err) } }()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
	<-stop
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	_ = server.Shutdown(shutdownCtx)
}

func (s *service) health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second); defer cancel()
	if err := s.db.Ping(ctx); err != nil { writeError(w, 503, "DATABASE_UNAVAILABLE", "PostgreSQL is unavailable"); return }
	writeJSON(w, 200, map[string]string{"service": "payments-go", "status": "ready"})
}

func (s *service) authorize(w http.ResponseWriter, r *http.Request) {
	var input authorizeRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 65536)).Decode(&input); err != nil { writeError(w, 400, "INVALID_JSON", "Request body must be valid JSON"); return }
	if input.TransactionID == "" || input.Amount <= 0 || !strings.Contains(input.Customer.Email, "@") { writeError(w, 422, "VALIDATION_ERROR", "transactionId, positive amount, and customer email are required"); return }
	if existing, found := s.findByTransaction(r.Context(), input.TransactionID); found { writeJSON(w, 200, existing); return }
	time.Sleep(s.latency)
	if rand.Float64() < s.failureRate { writeError(w, 402, "PAYMENT_DECLINED", "Payment simulation declined the authorization"); return }
	created := time.Now().UTC()
	result := payment{ID: "PAY-" + strings.ToUpper(strings.ReplaceAll(fmt.Sprintf("%08x", rand.Uint32()), "-", "")), TransactionID: input.TransactionID, Amount: input.Amount, Currency: "USD", Status: "authorized", Provider: "northstar-go-simulator", CreatedAt: created}
	_, err := s.db.Exec(r.Context(), "INSERT INTO payments.authorizations (id, transaction_id, amount, currency, customer_email, status, provider, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (transaction_id) DO NOTHING", result.ID, result.TransactionID, result.Amount, result.Currency, input.Customer.Email, result.Status, result.Provider, result.CreatedAt)
	if err != nil { writeError(w, 500, "DATABASE_ERROR", "Payment authorization could not be persisted"); return }
	if existing, found := s.findByTransaction(r.Context(), input.TransactionID); found { writeJSON(w, 201, existing); return }
	writeError(w, 500, "DATABASE_ERROR", "Payment authorization could not be loaded")
}

func (s *service) void(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	row := s.db.QueryRow(r.Context(), "UPDATE payments.authorizations SET status='voided', voided_at=COALESCE(voided_at, now()) WHERE id=$1 RETURNING id, transaction_id, amount, currency, status, provider, created_at, voided_at", id)
	value, err := scanPayment(row)
	if err != nil { writeError(w, 404, "PAYMENT_NOT_FOUND", "Payment authorization not found"); return }
	writeJSON(w, 200, value)
}

type scanner interface { Scan(...any) error }
func scanPayment(row scanner) (payment, error) { var value payment; err := row.Scan(&value.ID, &value.TransactionID, &value.Amount, &value.Currency, &value.Status, &value.Provider, &value.CreatedAt, &value.VoidedAt); return value, err }
func (s *service) findByTransaction(ctx context.Context, transactionID string) (payment, bool) { value, err := scanPayment(s.db.QueryRow(ctx, "SELECT id, transaction_id, amount, currency, status, provider, created_at, voided_at FROM payments.authorizations WHERE transaction_id=$1", transactionID)); return value, err == nil }

func setupTelemetry(ctx context.Context) (func(context.Context) error, error) {
	endpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if endpoint == "" { return func(context.Context) error { return nil }, nil }
	exporter, err := otlptracehttp.New(ctx, otlptracehttp.WithEndpointURL(strings.TrimSuffix(endpoint, "/")+"/v1/traces"))
	if err != nil { return nil, err }
	res := resource.NewSchemaless(semconv.ServiceName(env("OTEL_SERVICE_NAME", "payments-go")))
	provider := tracesdk.NewTracerProvider(tracesdk.WithBatcher(exporter), tracesdk.WithResource(res))
	otel.SetTracerProvider(provider)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))
	return provider.Shutdown, nil
}

func requestMiddleware(next http.Handler) http.Handler { return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { requestID := r.Header.Get("x-request-id"); if requestID == "" { requestID = fmt.Sprintf("go-%x", rand.Uint64()) }; w.Header().Set("x-request-id", requestID); w.Header().Set("content-type", "application/json"); next.ServeHTTP(w, r) }) }
func writeJSON(w http.ResponseWriter, status int, value any) { w.WriteHeader(status); _ = json.NewEncoder(w).Encode(value) }
func writeError(w http.ResponseWriter, status int, code, message string) { writeJSON(w, status, map[string]any{"error": map[string]string{"code": code, "message": message}}) }
func env(key, fallback string) string { if value := os.Getenv(key); value != "" { return value }; return fallback }

FROM golang:1.26.5-alpine AS build
WORKDIR /src
COPY services/payments-go/go.mod services/payments-go/go.sum ./
RUN go mod download
COPY services/payments-go/main.go .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /payments .

FROM alpine:3.22
RUN apk add --no-cache ca-certificates
COPY --from=build /payments /payments
EXPOSE 4006
USER 65532:65532
ENTRYPOINT ["/payments"]

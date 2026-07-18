FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY services/inventory-java/pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY services/inventory-java/src src
RUN mvn -q -DskipTests package && mvn -q dependency:copy -Dartifact=io.opentelemetry.javaagent:opentelemetry-javaagent:2.29.0 -DoutputDirectory=/otel -Dmdep.stripVersion=true

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/target/inventory-service-1.0.0.jar app.jar
COPY --from=build /otel/opentelemetry-javaagent.jar /otel/opentelemetry-javaagent.jar
EXPOSE 4005
RUN addgroup -S northstar && adduser -S northstar -G northstar
USER northstar
ENTRYPOINT ["java", "-javaagent:/otel/opentelemetry-javaagent.jar", "-jar", "/app/app.jar"]

FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
# Switched from 'openjdk' (deprecated) to 'eclipse-temurin'
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render sets the PORT environment variable. Spring Boot needs to listen on it.
ENV SERVER_PORT=${PORT}

ENTRYPOINT ["java", "-jar", "app.jar"]

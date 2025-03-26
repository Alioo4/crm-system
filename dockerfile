# Stage 1: Build the app
FROM node:20-alpine AS build

# Set working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --frozen-lockfile

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Copy the entire app into the container
COPY . .

# Build the app (if needed)
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

# Set working directory inside the container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app /app

# Install only production dependencies
RUN npm install --frozen-lockfile --production

# Expose the port the app runs on
EXPOSE 3000

# Run the application (NestJS server)
CMD ["npm", "run", "start"]

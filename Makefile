# Makefile for running both server and client npm projects together

.PHONY: start stop

# Default target that runs both projects
start:
	@echo "Starting server and client applications..."
	@make -j 2 run-server run-client

# Run the server project
run-server:
	@echo "Starting server..."
	cd server && bun run dev

# Run the client project
run-client:
	@echo "Starting client..."
	cd client && bun run dev

# Stop all running processes
stop:
	@echo "Stopping all processes..."
	@-pkill -f "bun run" || true

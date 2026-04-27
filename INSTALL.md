# Installation Instructions

## Prerequisites
- Docker and Docker Compose (install from [here](https://docs.docker.com/compose/install))
- Git (for cloning the repository)

## Clone the Repository
Clone the repository to your local machine:
```bash
git clone https://github.com/VenkatCSClasses/project-2-group-2.git
cd project-2-group-2
```

## Running the project
### Full Docker Setup (easiest)
Build and start the Docker containers (with the app profile):
```bash
docker compose --profile app up
```
If you want to run them in the background, add the `-d` flag:
```bash
docker compose --profile app up -d
```

### Hybrid Setup (for development):
#### Prerequisites:
- Install uv from their [official website](https://docs.astral.sh/uv/#installation)
- Install bun from their [official website](https://bun.sh/)

Start the database containers:
```bash
docker compose up
```
This will start the PostgreSQL and Valkey containers.

In a separate terminal, start the backend server:
```bash
cd backend 
uv run fastapi dev main.py
```

In another terminal, start the frontend development server:
```bash
cd frontend
bun dev
```

## Accessing the website
The frontend will be available at `http://localhost:5173` and the backend API will be available at `http://localhost:8000`.


For usage instructions, please refer to [DOCUMENTATION.md](DOCUMENTATION.md).
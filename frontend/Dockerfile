FROM node:18-bullseye

WORKDIR /app

COPY frontend/package.json ./package.json
COPY frontend/bun.lockb ./bun.lockb

RUN npm install

# Copy source
COPY frontend/ ./

EXPOSE 5173
CMD ["npm", "run", "dev"]

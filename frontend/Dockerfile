FROM oven/bun:1
WORKDIR /usr/src/app

COPY package.json ./
# Copy bun.lockb if it exists
COPY bun.lock* ./

RUN bun install

COPY . .

USER bun
EXPOSE 3000

CMD ["bun", "run", "dev", "--", "--host"]
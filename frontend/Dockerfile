FROM oven/bun:1
WORKDIR /usr/src/app

COPY package.json bun.lock* ./

RUN bun install

COPY . .

USER bun
EXPOSE 3000

CMD ["bun", "run", "dev", "--", "--host"]
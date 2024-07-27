FROM node:alpine3.20

WORKDIR /app/api

COPY src ./src
COPY package-lock.json .
COPY package.json .

RUN npm i

CMD [ "npm", "run", "dev" ]
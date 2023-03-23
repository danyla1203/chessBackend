FROM node:lts

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma/

COPY .env ./

RUN npm install\
      && npm install typescript -g
COPY . .
RUN tsc --skipLibCheck

RUN npx prisma generate

EXPOSE 9200

CMD [ "npm", "start" ]
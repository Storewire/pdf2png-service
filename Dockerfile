FROM node:16-alpine
WORKDIR /app
RUN apk add --update python3 make g++ fontconfig \
   && rm -rf /var/cache/apk/*

COPY server.js package*.json ./
RUN npm install --only=production
EXPOSE 3001
CMD [ "npm", "start" ]

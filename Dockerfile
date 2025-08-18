# Use official Node.js image as base
FROM node:latest
COPY . .
RUN npm install 
RUN npm install -g prisma
RUN npx prisma generate

CMD [ "npm","start" ]
 

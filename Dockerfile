# Use official Node.js image as base
FROM node:latest
COPY . .
RUN npm install -g nodemon



EXPOSE 8001
CMD [ "npm","start" ]
 

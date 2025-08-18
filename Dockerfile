# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install deps first (better cache layer)
COPY package*.json ./
RUN npm install --production

# Copy rest of the code
COPY . .

# Expose port (Render will set $PORT anyway, but good practice)
EXPOSE 10000

# Start server
CMD ["node", "index.js"]

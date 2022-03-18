
  
FROM node:14-alpine

# setup working directory
WORKDIR /app

# install node_modules in the container
COPY ["package.json", "./"]
RUN npm install --only=prod
COPY . .

EXPOSE 5000

# startup command
CMD ["npm", "run", "start"]
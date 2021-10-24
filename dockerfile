FROM node:14
RUN npm install -g nodemon
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
CMD ["npm", "run", "start.dev"]

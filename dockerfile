#Instructions go here if you didn't know what to do
FROM node:20-alpine

#Goes to the app directory (think of it like a cd terminal command)
WORKDIR /app

#Copies the package.json and package-lock.json to the app directory
COPY package*.json .

#Installs the dependencies
RUN npm install

#Copies the rest of the code to the app directory
COPY . .

#Sets the port to 3000
ENV PORT=5173

#Exposes the port 3000
EXPOSE 5173

#Runs the app
CMD ["npm", "run", "dev"]

#To build the image (Do it in the terminal command)
#docker build -t herland-laundry-system (frontend).

#To run the image
#docker run -p 5173:5173 herland-laundry-system
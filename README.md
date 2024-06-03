# Ft_Transcendance 🏓

My first web project which consists of creating a website to participate in a competition of the famous Pong game. 

## Description 🔍

Project done in a group which requires the creation of a matchmaking system for the pong game, the creation of a chat between players (private or group) and the creation of an user profile for each player . With this for each user a display of each game played and a ranking between the players, plus a functionality for adding friends to be able to play with them!
It was interesting to code website for the first time and to implement all the processes from the visual (Front-end) to the backstage (Back-end and Database). We use Nextjs as framework for the front-end, neastjs as back-end and Postgress for the database (using postman for the visual). My part in this project was to implement pong game's side; So the game implementation (front-end and back-end, and I use P5 as graphic library ), matchmaking between players and add all the data in the database. 👩‍💻

## Getting started ! 🏁

### Dependencies  🛠️
* Docker
* Npm
* .env (private)
* PostgreSQL

### Installation 📦

### To begin without Docker (not recommended)

```bash
~ cd ./frontend
~ npm i
~ npm run dev
````
```bash
~ cd ./backend
~ npm i
~ npm run start:dev
````
   -> Dev mode to work in live

see pages:

http://localhost:3000 -> Frontend 

## Env file
* use .env.example to implement your env file in bakckend, frontend folder  

## Running the program 💻

* Before to launch set the .env file for the back-end and front-end, you can find .env.example in the both folder.
* To launch the project use docker-compose
```
~ docker compose up --build
```
* To stop and remove all containers
 ```
~ docker compose down
```
And go to [http](http://localhost:3000) !!

## Contributors 👩‍💻
* @marieines7
* @dediane
* @balkisous

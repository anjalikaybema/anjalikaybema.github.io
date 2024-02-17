CS171 Final Project
The final project of CS171 will live here.

In this project we tell a narrative about the NFL and teams chances for winning.


For this project to work you need to have Docker installed in order to run the backend API.

The backend API will return the play data for a given match and return the play.

Once docker installed, and running you need to cd into the backend-api folder

Then type `sh docker-shell.sh` which will build your docker container that runs the backend-API. It runs the backend API on your localhost port 9000.

Once the docker container finished building run `uvicorn_server` for the server to start. This should start you backend API and you should be able to go to the Website and interact with the API.



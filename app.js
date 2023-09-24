const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertDbObjectToResponseObjectmatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//getting list of all players
app.get("/players/", async (request, response) => {
  const Query = `
    SELECT
      *
    FROM
      player_details`;
  const playersArray = await db.all(Query);
  response.send(
    playersArray.map((each) => convertDbObjectToResponseObject(each))
  );
});

//getting single player
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT
      *
    FROM
      player_details
    where player_id=${playerId}`;
  const playersArray = await db.get(Query);
  response.send(convertDbObjectToResponseObject(playersArray));
});

//update player
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const Query = `
  update player_details set player_name='${playerName}' where player_id=${playerId}`;

  await db.run(Query);
  response.send("Player Details Updated");
});

//getting a single match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const Query = `
    SELECT
      *
    FROM
      match_details
    where match_id=${matchId}`;
  const matchArray = await db.get(Query);
  response.send(convertDbObjectToResponseObjectmatch(matchArray));
});

//gettig matches palyed by player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT
      *
    FROM
 player_match_score natural join match_details where player_id=${playerId}`;
  const matchesArray = await db.all(Query);
  response.send(
    matchesArray.map((each) => convertDbObjectToResponseObjectmatch(each))
  );
});
//getting players of a match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const Query = `
    SELECT
      *
    FROM
 player_match_score natural join player_details where match_id=${matchId}`;
  const playersArray = await db.all(Query);
  response.send(
    playersArray.map((each) => convertDbObjectToResponseObject(each))
  );
});

//statistics
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT
      player_id as playerId,player_name as playerName, sum(score) as totalScore , sum(fours) as totalFours, sum(sixes) as totalSixes
    FROM
 player_match_score natural join player_details where player_id=${playerId}`;
  const resultArray = await db.get(Query);
  response.send(resultArray);
});

module.exports = app;

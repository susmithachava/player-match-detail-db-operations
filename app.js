const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;
const app = express();
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http:/localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayerDetailsDbToResponseDb = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbToResponseDb = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const selectPlayersQuery = `SELECT *
    FROM player_details;`;
  const playersArray = await database.all(selectPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDetailsDbToResponseDb(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailsQuery = `SELECT * 
    FROM player_details 
    WHERE player_id = '${playerId}';`;
  const player = await database.get(getPlayerDetailsQuery);
  response.send(convertPlayerDetailsDbToResponseDb(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details
    SET 
    player_name = '${playerName}'
    WHERE player_id = '${playerId}';`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const selectMatchQuery = `SELECT * FROM
    match_details 
    WHERE match_id = ${matchId};`;
  const match = await database.get(selectMatchQuery);
  response.send(convertMatchDetailsDbToResponseDb(match));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const playerMatches = await database.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbToResponseDb(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await database.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDetailsDbToResponseDb(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score 
    NATURAL JOIN player_details
    WHERE 
    player_id = '${playerId}';`;
  const stats = await database.get(getStatsQuery);
  response.send(stats);
});

module.exports = app;

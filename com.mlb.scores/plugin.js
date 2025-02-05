
function parseFeed(text, teamName) {
  const json = JSON.parse(text);
  var games = [];
  json.dates.forEach((date) => {
    date.games.forEach((game) => {
      // Only this team
      if (game.teams.away.team.name === teamName || game.teams.home.team.name === teamName) {
        // Only finished games
        if (game.status.statusCode === "F") {
          games.push(game);
        }
      }
    });
  });

  return games.map((game) => {
    let link = `https://www.mlb.com/gameday/${game.gamePk}/final/wrap`;
    let item = Item.createWithUriDate(link, Date.parse(game.gameDate));
    let winnerLoser = getWinnerLoser(game);
    if (winnerLoser.winner.team.name === teamName) {
      item.title = `${teamName} win`;
      let locality = winnerLoser.winner == game.teams.away ? "on the road" : "at home";
      item.body = `The <strong>${teamName}</strong> beat the <strong>${winnerLoser.loser.team.name}</strong> ${winnerLoser.winner.score} to ${winnerLoser.loser.score} ${locality}`;
    } else {
      item.title = `${teamName} lose`;
      let locality = winnerLoser.loser == game.teams.away ? "on the road" : "at home";
      item.body = `The <strong>${teamName} lose to the <strong>${winnerLoser.winner.team.name}</strong> ${winnerLoser.loser.score} to ${winnerLoser.winner.score} ${locality}`;
    }

    return item;
  });
}

function getWinnerLoser(game) {
  if (game.teams.away.score > game.teams.home.score) {
    return {
      winner: game.teams.away,
      loser: game.teams.home
    };
  } else if (game.teams.away.score < game.teams.home.score) {
    return {
      winner: game.teams.home,
      loser: game.teams.away
    }
  }
  // A tie?
  return undefined;
}

function load() {
  let endDate = new Date(); // new Date(Date.parse("2024-09-04"));
  const daysAgoStart = 4;
  var startDate = new Date(endDate - (daysAgoStart * 86400 * 1000));

	const endpoint = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;

  console.log(`Requesting: ${endpoint}`);
  sendRequest(endpoint)
	.then((text) => {
		processResults(parseFeed(text, team));
	})
	.catch((requestError) => {
		processError(requestError);
	});
}
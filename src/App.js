import React from 'react';
import './App.css';
import { setTimeout } from 'timers';

const testFlag = true;

// const updateTime = 300000;
const updateTime = 60 * 1000;
const statSettings = {
  "Goals": {
    importance: 0.25,
    maxDifference: 2
  },
  "Shots on Goal": {
    importance: 0.35,
    maxDifference: 4
  },
  "Total Shots": {
    importance: 0.05,
    maxDifference: 5
  },
  "Corner Kicks": {
    importance: 0.25,
    maxDifference: 7
  },
  "Ball Possession": {
    importance: null,
    maxDifference: 15
  },
  "Offsides": {
    importance: null,
    maxDifference: null
  },
  "Fouls": {
    importance: null,
    maxDifference: null
  },
  "Yellow Cards": {
    importance: 0.1,
    maxDifference: -5
  },
  "Red Cards": {
    importance: null,
    maxDifference: -2
  }
};
const timeImportance = 1 - statSettings['Goals'].importance;
const importantStatCount = Object.values(statSettings).filter((setting => setting.importance)).length - 1;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      gameTime: 0,
      statistics: null
    };

    if (testFlag) {
      const intervalID = setInterval(() => {
        if (this.state.gameTime > 90) {
          clearInterval(intervalID);
        } else {
          this.setState({
            gameTime: this.state.gameTime + 2,
            statistics: testStats
          });
        }
      }, 2000);
      return;
    }

    let intervalId = setTimeout(() => {
      fetch('https://api-football-v1.p.rapidapi.com/v2/statistics/fixture/154352', {
        
        headers: {
          'X-RapidAPI-Key': '995b5d35bfmsh718e59d1d347fe3p13bf54jsndcce2fdf0ff8',
          'Accept': 'application/json'
        }
      })
      .then(response => response.json().then(data => {
        if (this.state.gameTime > 90) {
          clearInterval(intervalId);
        } else {
          this.setState({
            gameTime: this.state.gameTime + (updateTime / 60000),
            statistics: {...data.api.statistics}
          });
        }
      }))
    }, updateTime);
  }

  render() {
    if (!this.state.statistics) return null;
    
    let statistics = createStatsWithGoals(this.state.statistics);    
    deleteUnwantedStats(statistics);
    addAdvantageStatistics(statistics);
    // console.log('statistics to render', statistics);
    
    return (
      <div id="main-container" className="container-fluid">
        <div className="row">
          <TeamInfoColumn
            teamName="Jagiellonia"
            teamLogoUrl="./assets/jagiellonia-logo.png"
          />
          <div className="col-6 border">
            <div className="row">
              <div className="col border">Stats</div>
            </div>
            <StatRow 
                key="win"
                statInfo="Win chance"
                hostPercentage={calculateWinAdvantage(statistics, this.state.gameTime)}
              />
            {Object.entries(statistics).map(([statName, stat]) => {
              if (statName === 'Fouls') stat.homeAdvantage = 100 - stat.homeAdvantage;
              return <StatRow 
                key={statName}
                statInfo={statName}
                hostScore={stat.home}
                guestScore={stat.away}
                hostPercentage={stat.homeAdvantage}
              />
            })}
          </div>
          <TeamInfoColumn
            teamName="Legia"
            teamLogoUrl="./assets/legia-logo.png"
          />
        </div>
        <p>Time: {this.state.gameTime} mins</p>
        <br></br>
        <input type="number" onKeyDown={(e) => { this.updateTimer(e) }}></input>
      </div>
    );
  }

  updateTimer(e) {
    this.state.gameTime = parseInt(e.target.value);
  }
}

function StatRow(props) {
  return (
    <div className="row mb-2 stat-row">
      <div className="col-3">{props.hostScore}</div>
      <div className="col-6">
        <div className="row h-100">
          <div className="p-0 bg-danger stat-bar" style={{width: props.hostPercentage + '%'}}></div>
          <div className="col p-0 bg-success"></div>
          <div className="stat-row-info">{props.statInfo + ` (${props.hostPercentage}%)`}</div>
        </div>
      </div>
      <div className="col-3">{props.guestScore}</div>
    </div>
  );
}

function TeamInfoColumn(props) {
  return (
    <div className="col-3 border">
      <div className="row">
        <div className="col border">{props.teamName}</div>
      </div>
      <div className="row">
        <div className="col">
          <div className="col"><img src={props.teamLogoUrl} alt=""/></div>
        </div>
      </div>
    </div>
  );
}

function createStatsWithGoals(statistics) {
  return {
    'Goals': {
      home: statistics['Shots on Goal'].home - statistics['Goalkeeper Saves'].away,
      away: statistics['Shots on Goal'].away - statistics['Goalkeeper Saves'].home
    },
    ...statistics
  };
}

function deleteUnwantedStats(statistics) {
  delete statistics['Total passes'];
  delete statistics['Passes accurate'];
  delete statistics['Goalkeeper Saves'];
  delete statistics['Shots off Goal'];
  delete statistics['Blocked Shots'];
  delete statistics['Shots insidebox'];
  delete statistics['Shots outsidebox'];
  delete statistics['Passes %'];
}

function addAdvantageStatistics(statistics) {  
  for (const [statName, stat] of Object.entries(statistics)) {
    statistics[statName].homeAdvantage = 
      calculateStatisticAdvantage(stat.home, stat.away, statSettings[statName].maxDifference);
  }
}

function calculateStatisticAdvantage(homeScore, awayScore, maxDifference) {
  homeScore = parseInt(homeScore, 10);
  awayScore = parseInt(awayScore, 10);
  if (homeScore === 0 && awayScore === 0) return 50;
  if (!maxDifference) return Math.floor((homeScore / (homeScore + awayScore)) * 100);

  const diff = homeScore - awayScore;
  let advantage = diff * (50 / maxDifference);
  if (Math.abs(advantage) > 50) advantage = 50;
  return Math.floor(50 + advantage);
}

function calculateWinAdvantage(statistics, gameTime) {
  let winnerAdvantage = 0;

  const minorStatImportances = timeImportance;

  for (const [statName, setting] of Object.entries(statSettings)) {    
    if (!setting.importance) continue;    

    const stat = statistics[statName];
    const statImportance = setting.importance;    

    const timeFraction = gameTime < 65 ? (gameTime / 150) : (gameTime / 90);

    const timeFactor = timeImportance * ((timeFraction) * (statName === 'Goals' ? 1 : -(statImportance / timeImportance)));
    const finalImportance = statImportance + timeFactor;
    winnerAdvantage += stat.homeAdvantage * (finalImportance < 0 ? 0 : finalImportance);

    console.log(statName, statImportance, timeFactor, winnerAdvantage);
  }

  if (gameTime >= 75 && statistics['Goals'].home !== statistics['Goals'].away) {
    const timeLeft = gameTime - 75;
    const homeWinning = statistics['Goals'].home > statistics['Goals'].away;
    const chanceLeft = homeWinning ? 100 - winnerAdvantage : -winnerAdvantage;
    winnerAdvantage += chanceLeft * (timeLeft / 15);
  }

  return winnerAdvantage > 100 ? 
    100 : winnerAdvantage < 0 ? 
    0 : Math.floor(winnerAdvantage);
}

export default App;


const testStats = {
  "Shots on Goal": {
    "home": "1",
    "away": "4"
  },
  "Shots off Goal": {
      "home": "9",
      "away": "5"
  },
  "Total Shots": {
      "home": "10",
      "away": "8"
  },
  "Blocked Shots": {
      "home": null,
      "away": null
  },
  "Shots insidebox": {
      "home": null,
      "away": null
  },
  "Shots outsidebox": {
      "home": null,
      "away": null
  },
  "Fouls": {
      "home": "20",
      "away": "10"
  },
  "Corner Kicks": {
      "home": "0",
      "away": "3"
  },
  "Offsides": {
      "home": "2",
      "away": "0"
  },
  "Ball Possession": {
      "home": "53%",
      "away": "47%"
  },
  "Yellow Cards": {
      "home": "5",
      "away": "4"
  },
  "Red Cards": {
      "home": "0",
      "away": "1"
  },
  "Goalkeeper Saves": {
      "home": "4",
      "away": "1"
  },
  "Total passes": {
      "home": null,
      "away": null
  },
  "Passes accurate": {
      "home": null,
      "away": null
  },
  "Passes %": {
      "home": null,
      "away": null
  }
};

const testInitialStats = {
  "Shots on Goal": {
    "home": "0",
    "away": "0"
  },
  "Shots off Goal": {
      "home": "0",
      "away": "0"
  },
  "Total Shots": {
      "home": "0",
      "away": "0"
  },
  "Fouls": {
      "home": "0",
      "away": "0"
  },
  "Corner Kicks": {
      "home": "0",
      "away": "0"
  },
  "Offsides": {
      "home": "0",
      "away": "0"
  },
  "Ball Possession": {
      "home": "50%",
      "away": "50%"
  },
  "Yellow Cards": {
      "home": "0",
      "away": "0"
  },
  "Red Cards": {
      "home": "0",
      "away": "0"
  },
  "Goalkeeper Saves": {
      "home": "0",
      "away": "0"
  },
  "Total passes": {
      "home": null,
      "away": null
  },
  "Passes accurate": {
      "home": null,
      "away": null
  }
};

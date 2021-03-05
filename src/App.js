import React from 'react';
import './App.css';
import { setTimeout } from 'timers';

// fetch('https://api-football-v1.p.rapidapi.com/v2/fixtures/date/2019-10-19', {
//   headers: {
//     'X-RapidAPI-Key': '995b5d35bfmsh718e59d1d347fe3p13bf54jsndcce2fdf0ff8',
//     'Accept': 'application/json'
//   }
// }).then();

const testFlag = false;

var updateRunning = false;

const updateTime = 180000;
// const updateTime = 60 * 1000;
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
      statistics: testInitialStats
    };

    if (testFlag) {
      let goal = false;
      const intervalID = setInterval(() => {
        if (this.state.gameTime > 90) {
          clearInterval(intervalID);
        } else {
          if (!updateRunning) return;

          if (this.state.gameTime >= 70 && !goal) {
            let zxc = parseInt(testStats['Shots on Goal'].away);
            testStats['Shots on Goal'].away = zxc + 1;
            goal = true;
          }

          let stats = testStats;
          debugger
          for (let statName in stats) {
            if (stats.hasOwnProperty(statName)) {
              if (stats[statName].home === null) stats[statName].home = 0;
              if (stats[statName].away === null) stats[statName].away = 0;
            }
          }

          this.setState({
            gameTime: this.state.gameTime + 1,
            statistics: stats
          });
        }
      }, 1000);
      return;
    }

    let intervalId = setInterval(() => {
      if (!updateRunning) return;

      fetch('https://api-football-v1.p.rapidapi.com/v2/statistics/fixture/154397', {
        headers: {
          'X-RapidAPI-Key': '995b5d35bfmsh718e59d1d347fe3p13bf54jsndcce2fdf0ff8',
          'Accept': 'application/json'
        }
      })
      .then(response => response.json().then(data => {
        if (this.state.gameTime > 90) {
          clearInterval(intervalId);
        } else {
          let stats = data.api.statistics;

          for (let statName in stats) {
            if (stats.hasOwnProperty(statName)) {
              if (stats[statName].home === null) stats[statName].home = 0;
              if (stats[statName].away === null) stats[statName].away = 0;
            }
          }

          console.log(JSON.stringify(stats));

          this.setState({
            gameTime: this.state.gameTime + (updateTime / 60000),
            statistics: {...stats}
          });
        }
      }))
    }, updateTime);
  }

  render() {
    if (!this.state.statistics || this.state.statistics.length === 0) return null;

    let statistics = createStatsWithGoals(this.state.statistics);    
    deleteUnwantedStats(statistics);
    addAdvantageStatistics(statistics);
    // console.log('statistics to render', statistics);

    const winAdvantage = calculateWinAdvantage(statistics, this.state.gameTime);
    
    return (
      <div id="main-container" className="container-fluid">
        <div className="row">
          <TeamInfoColumn
            teamName="Jagiellonia"
            teamLogoUrl="./assets/home-logo.png"
            winAdvantage={winAdvantage}
          />
          <div className="col-6 border" style={{paddingBottom: '9px'}}>
            <div className="row">
              <div className="col border">Stats</div>
            </div>
            <WinnerStatBar
              statName="Win chance"
              homeAdvantage={winAdvantage}
            />
            <div className="row">
              <div className="col-12 p-0">
                <hr className="bg-white"/>
              </div>
            </div>
            {Object.entries(statistics).map(([statName, stat]) => {
              if (statName === 'Fouls') stat.homeAdvantage = 100 - stat.homeAdvantage;
              if (statName === 'Red Cards') return (<StatRow 
                key={statName}
                statName={statName}
                hostScore={stat.home}
                guestScore={stat.away}
                homeAdvantage={stat.homeAdvantage}
              />);

              return [ <StatRow 
                key={statName}
                statName={statName}
                hostScore={stat.home}
                guestScore={stat.away}
                homeAdvantage={stat.homeAdvantage}
              />,
              <hr style={{margin: '5px', backgroundColor: '#61dafb'}}/>
              ]
            })}
          </div>
          <TeamInfoColumn
            teamName="Cracovia"
            teamLogoUrl="./assets/away-logo.png"
            winAdvantage={100 - winAdvantage}
          />
        </div>
        <div className="progress" style={{marginLeft: '-15px', marginRight: '-15px'}}>
          <div className="progress-bar" style={{width: `${this.state.gameTime / 90 * 100}%`}}></div>
        </div>
        <div>Time: {this.state.gameTime} mins</div>
        <div>(next update on {this.state.gameTime + (updateTime / 60000)} min)</div>
        <br></br>
        <button type="button" className="btn btn-light" data-toggle="button" aria-pressed="false" autoComplete="off" onClick={onUpdateButtonClick}>
          Update On/Off
        </button>
        <br></br><br></br>
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
    <div className="row stat-row">
      <div className="col-3">{props.hostScore}</div>
      <div className="col-6">
        <StatBar
          statName={props.statName}
          homeAdvantage={props.homeAdvantage}
        />
      </div>
      <div className="col-3">{props.guestScore}</div>
    </div>
  );
}

function StatBar(props) {
  return (
    <div className="row h-100">
      <div className="p-0 bg-primary stat-bar" style={{width: props.homeAdvantage + '%'}}></div>
      <div className="col p-0 bg-danger"></div>
      <div className="stat-row-info">{props.statName + ` (${props.homeAdvantage}%)`}</div>
    </div>
  );
}

function WinnerStatBar(props) {
  return (
    <div id="winner-stat-row" className="row mt-3">
      <div className="col-12">
        <div className="progress h-100" style={{fontSize: '20px'}}>
          <div className="progress-bar bg-primary" style={{width: `${props.homeAdvantage}%`}}>{`${props.homeAdvantage}%`}</div>
          <div className="progress-bar bg-danger" style={{width: `${100 - props.homeAdvantage}%`}}>{`${100 - props.homeAdvantage}%`}</div>
        </div>
      </div>
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
        <div className="col" style={{backgroundColor: `rgba(255, 255, 0, ${(props.winAdvantage < 50 ? 0 : (props.winAdvantage - 50)) / 50})`}}>
          <div className="col"><img src={props.teamLogoUrl} alt="" style={{height: '390px'}}/></div>
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

function onUpdateButtonClick() {
  updateRunning = !updateRunning;
} 

export default App;


const testStats = {
  "Shots on Goal": {
    "home": "2",
    "away": null
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

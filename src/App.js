import React from 'react';
import './App.css';
import { setTimeout } from 'timers';

const statImportances = {
  "Goals": 0.35,
  "Shots on Goal": 0.25,
  "Total Shots": 0.1,
  "Corner Kicks": 0.2,
  "Yellow Cards": 0.1,
}
const timeImportance = 100 - statImportances['Goals'];

const maxStatDifferences = {
  "Goals": 3,
  "Shots on Goal": 5,
  "Total Shots": 10,
  "Corner Kicks": 10,
  "Ball Possession": 15,
  "Yellow Cards": -5,
  "Red Cards": -2
};

class App extends React.Component {
  constructor(props) {
    super(props);
    // this.state = { Time: 1 };
    this.state = {
      "Time": 1,
      "Statistics": {
        "Shots on Goal": {
          "home": "3",
          "away": "3"
      },
      "Shots off Goal": {
          "home": "9",
          "away": "5"
      },
      "Total Shots": {
          "home": "10",
          "away": "8"
      },
      "Fouls": {
          "home": "20",
          "away": "10"
      },
      "Corner Kicks": {
          "home": "6",
          "away": "2"
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
          "home": "3",
          "away": "1"
      },
      "Total passes": {
          "home": null,
          "away": null
      },
      "Passes accurate": {
          "home": null,
          "away": null
      }
      }
    };
    setInterval(() => {
      if (this.state['Time'] < 90) {
        let state = Object.assign({}, this.state);
        state['Time'] += 2;
        this.setState(state);
      }
    }, 2000);
    return;

    let intervalId = setTimeout(() => {
      fetch('https://api-football-v1.p.rapidapi.com/v2/statistics/fixture/154352', {
        
        headers: {
          'X-RapidAPI-Key': '995b5d35bfmsh718e59d1d347fe3p13bf54jsndcce2fdf0ff8',
          'Accept': 'application/json'
        }
      })
      .then(response => response.json().then(data => {
        if (this.state['Time'] > 90) {
          clearInterval(intervalId);
        } else {
          let state = {
            'Time': this.state['Time'] + 5,
            'Statistics': {...data.api.statistics}
          };
          console.log(state);
          console.log(data);
          
          
          this.setState(state);
        }
      }))
    }, 1000);
  }

  render() {
    if (!this.state.Statistics) return null;
    console.log(this.state.Statistics);
    
    let stats = {
      'Goals': {
        home: this.state.Statistics['Shots on Goal'].home - this.state.Statistics['Goalkeeper Saves'].away,
        away: this.state.Statistics['Shots on Goal'].away - this.state.Statistics['Goalkeeper Saves'].home
      },
      ...this.state.Statistics
    };
    console.log('stats: ', this.state.Statistics);
    console.log('stats: ', stats);
    delete stats['Total passes'];
    delete stats['Passes accurate'];
    delete stats['Goalkeeper Saves'];
    delete stats['Shots off Goal'];
    delete stats['Blocked Shots'];
    delete stats['Shots insidebox'];
    delete stats['Shots outsidebox'];
    delete stats['Passes %'];
    let time = this.state['Time'];
    for (let statName in stats) {
      stats[statName].homePercentage = 
        calculateScoreAdvantagePercentage(stats[statName].home, stats[statName].away, maxStatDifferences[statName]);
    }
    console.log('stats: ', stats);
    
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
                key="Winnder"
                statInfo="Win chance"
                hostPercentage={calculateWinnerPercentage(stats, time)}
              />
            {Object.entries(stats).map(([statName, statValue]) => {
              if (statName === 'Fouls') statValue.homePercentage = 100 - statValue.homePercentage;

              return <StatRow 
                key={statName}
                statInfo={statName}
                hostScore={statValue.home}
                guestScore={statValue.away}
                hostPercentage={statValue.homePercentage}
              />
            })}
          </div>
          <TeamInfoColumn
            teamName="Legia"
            teamLogoUrl="./assets/legia-logo.png"
          />
        </div>
        <p>Time: {time} mins</p>
        <br></br>
        <input type="number" onKeyDown={(e) => { this.updateTimer(e) }}></input>
      </div>
    );
  }

  updateTimer(e) {
    this.state['Time'] = parseInt(e.target.value);
    console.log(this.state['Time']);
    
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

function calculateScoreAdvantagePercentage(homeScore, awayScore, maxDifference) {
  homeScore = parseInt(homeScore, 10);
  awayScore = parseInt(awayScore, 10);
  if (!maxDifference) return Math.floor((homeScore / (homeScore + awayScore)) * 100);

  const diff = homeScore - awayScore;
  let advantage = diff * (50 / maxDifference);
  if (Math.abs(advantage) > 50) advantage = 50;
  return Math.floor(50 + advantage);
}

function calculateWinnerPercentage(stats, time) {
  let winnerPercentage = 0;
  for (let statName in statImportances) {
    if (statName === 'Goals') {
      // console.log('goal importance: ', statImportances[statName] + (timeImportance * (time / 90)));
      
      winnerPercentage += stats[statName].homePercentage * (statImportances[statName] + (timeImportance * (time / 90)));
    } else {
      // console.log('other importance: ', statImportances[statName] - (timeImportance * (time / 90)) / Object.keys(statImportances).length);
      winnerPercentage += stats[statName].homePercentage * Math.abs((statImportances[statName] - (timeImportance * (time / 90)) / Object.keys(statImportances).length));
    }
  }
  return winnerPercentage > 100 ? 100 : Math.floor(winnerPercentage);
}

export default App;

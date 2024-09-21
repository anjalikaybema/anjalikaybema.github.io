// Function to convert date objects to strings or reverse
let dateFormatter = d3.timeFormat("%Y-%m-%d");
let dateParser = d3.timeParse("%Y-%m-%d");

// Declaring global variables
let diagramVis, winsTime, xScale, offensiveVis, superVis,  selectionDomain, timelineVis, clickedTeam, colorScale, storePoints, storeGames, storeDefenseData, storeOffenseData, teamVs, lastLogo;

// declaring data variables as global for later

let games, plays, trackingWeek1, gameId

window.onload = function () {
    window.scrollTo(0, 0);
};

// Step 1 Load data using promises

let promises = [
    d3.csv("data/games.csv"),

    // all the plays data
    d3.csv("data/plays.csv"),

    // Test data to visualize a play
    d3.csv('data/testPlay.csv'),

    d3.csv('data/plays.csv'),

    // To spead up development we only include the games promise
    d3.csv("data/plays.csv"),
    d3.csv("data/players.csv"),
    d3.csv("data/tackles.csv"),
    d3.csv('data/timeline-text.csv'),
    d3.csv("data/superbowl.csv"),

    // TrackingWeek data the reason why it takes so long to load!
    // d3.csv('data/tracking_week_1.csv'),
    // d3.csv('data/tracking_week_2.csv'),
    // d3.csv('data/tracking_week_3.csv'),
    // d3.csv('data/tracking_week_4.csv'),
    // d3.csv('data/tracking_week_5.csv'),
    // d3.csv('data/tracking_week_6.csv'),
    // d3.csv('data/tracking_week_7.csv'),
    // d3.csv('data/tracking_week_8.csv'),
    // d3.csv('data/tracking_week_9.csv'),
];


Promise.all(promises)
    .then(function (data) {
        createVis(data)
    })
    .catch(function (err) {
        console.log(err)
    });

// Creating the Vis
function createVis(data) {

    games = data[0]
    plays = data[1]
    let testPlay = data[2]
    let players = data[2]
    let teams = data[3]
    // trackingWeek1 = data[6]
    let timelineText = data[7]
    let tackles = data[6]
    let superbowlWin = data[8]
    // trackingWeek2 = data

    // It's faster to give as an array as supposed to looping through the lists each time the website is opened
    let teamsAbbr = ['LA', 'BUF', 'ATL', 'NO', 'CAR', 'CLE', 'CHI', 'SF', 'CIN', 'PIT', 'DET', 'PHI', 'HOU', 'IND', 'MIA', 'NE', 'NYJ', 'BAL', 'WAS', 'JAX', 'ARI', 'KC', 'LAC', 'LV', 'MIN', 'GB', 'TEN', 'NYG', 'DAL', 'TB', 'SEA', 'DEN']

    // Creating positional Game Visualization.
    // let logosVis = new LogosVis("logosVis", games, teamsAbbr);
    // document.addEventListener('DOMContentLoaded', function() {
    //     // Your code goes here
    //     let logosVis = new LogosVis("sidenavLeft", games, teamsAbbr.slice(0, 16));
    // });
    let logosVisLeft = new LogosVis("sidenavLeft", games, teamsAbbr.slice(0, 16));
    let logosVisRight = new LogosVis("sidenavRight", games, teamsAbbr.slice(16, 32));


    // Universal colorscale so all vis are linked
    colorScale = d3.scaleOrdinal()
        .domain(teams)
        .range(["#a452b7",
            "#6e60e0",
            "#e7c83a",
            "#8e61e9",
            "#3c9976",
            "#b254c9",
            "#74935f",
            "#db53be",
            "#e06555",
            "#a4b5f2",
            "#8943c2",
            "#e5714f",
            "#d34228",
            "#d73f50",
            "#41c4ce",
            "#70e198",
            "#ab5f30",
            "#cc5c33",
            "#ae4e97",
            "#da417f",
            "#815be0",
            "#81d02d",
            "#50a481",
            "#e5c316",
            "#a2b95d",
            "#2c7ea9",
            "#e18425",
            "#236ead",
            "#bb79c5",
            "#4a73a3",
            "#35618f",
            "#65c1f0",
            "#b05054",
            "#e3cd2e",
            "#e8d325",
            "#e495d1",
            "#df6e96",
            "#3ba1d2",
            "#a45d82",
            "#6d67a0"]);

    navBarFunctionality();

    diagramVis = new DiagramVis("diagramVis", games, teamsAbbr);
    winsTime = new WinsVis("winsTime", games, teamsAbbr);
    // playVis = new PlayVis("playVis", games, teamsAbbr, plays, testPlay);
    timelineVis = new TimelineVis("timeLine", timelineText, teamsAbbr);
    offensiveVis = new OffensiveVis("offensiveVis", plays, tackles, teamsAbbr);
    superVis = new SuperVis("superBowl", superbowlWin, teamsAbbr);
    // teamVs = new TeamsVs('teamVs', ['LA', 'BUF'])

    // d3.xml("data/images/stadium.svg").then(function (xml) {
    //     var svg = d3.select(".stadium-graphic").node();
    //     svg.appendChild(xml.documentElement);
    // });

    d3.xml("data/images/helmet.svg").then(function (xml) {
        var svg = d3.select(".helmet-graphic").node();
        svg.appendChild(xml.documentElement);
    });

    titleStyle();

    document.body.classList.add('loaded');
}

// to begin with lastLogo is 'LA'
lastLogo = 'LA'
function handleLogoClick(teamAbbr) {

    // Adjust window pos if above logo element, otherwise want the graphs to be updated and displayed immediately for the user (instead of scrolling back to logo display)
    let scrollTarget = document.querySelector(".logo-display");

    let scrollThreshold = document.querySelector(".scroll-threshold");

    if (window.scrollY < scrollThreshold.getBoundingClientRect().top) {

        // If above, scroll to the logo
        scrollTarget.scrollIntoView({ behavior: "smooth" });
    }

    superVis.updateVis();

    handleUserSelection();

    // Highlighting the selected team
    winsTime.highlightTeam(teamAbbr);
    diagramVis.highlightTeam(teamAbbr);

    // on logo click update what teams to display for the play visualization
    // teamVs.updateTeams([lastLogo, teamAbbr])


    // Select Field has TeamName in it
    document.getElementById('selectOne').innerHTML += 'Possesion for ' + lastLogo;
    document.getElementById('selectTwo').innerHTML += 'Possesion for ' + teamAbbr;

    // first find game ID
    let filteredGames = games.filter(game =>
        (game.homeTeamAbbr === lastLogo && game.visitorTeamAbbr === teamAbbr) ||
        (game.homeTeamAbbr === teamAbbr && game.visitorTeamAbbr === lastLogo)
    );

    if (filteredGames.length > 0) {
        // If the two selected teams played each other than this should be more than 0
        gameId = filteredGames[0].gameId;

        let filteredPlays = plays.filter(play =>
            (play.gameId === gameId) &(play.possessionTeam === lastLogo));

        updateSelect('selectOne', filteredPlays);

        let filteredPlaysTwo = plays.filter(play =>
            (play.gameId === gameId) &(play.possessionTeam === teamAbbr));

        updateSelect('selectTwo', filteredPlaysTwo)
    } else {
        // No games found
        console.log("These two teams did not play each other.");
        // You might also want to clear or update the select dropdown appropriately
        updateSelect('selectOne', []);
    }

    // Create eventListener for both the select Options!
    document.getElementById('selectOne').addEventListener('change', async function(event) {
        const selectedValue = event.target.value;

        // Wait for the fetchPlayData function to complete and get the result
        let playData = await fetchPlayData(selectedValue, gameId);

        // playData here will be the actual array from the resolved promise
        console.log('Returned output here:');
        console.log(playData);

        // Use the playData to update the visualization
        // playVis.updateVisualization(playData);
    });

    document.getElementById('selectTwo').addEventListener('change', async function(event) {
        const selectedValue = event.target.value;

        // Wait for the fetchPlayData function to complete and get the result
        let playData = await fetchPlayData(selectedValue, gameId);

        // playData here will be the actual array from the resolved promise
        console.log('Returned output here:');
        console.log(playData);

        // Use the playData to update the visualization
        // playVis.updateVisualization(playData);
        // playVis.updateVis();
    });



    // the last clicked team will become the other team
    lastLogo = teamAbbr
}

// // Request to API
// async function fetchPlayData(playId, gameId) {
//     try {
//         // Constructing URL
//         const url = new URL('http://localhost:9000/api/fetchArray');
//         url.search = new URLSearchParams({ play_id: playId, game_id: gameId });
//
//         // Get request
//         const response = await fetch(url);
//
//         // Parse the JSON response
//         return await response.json();
//
//     } catch (error) {
//         console.error('Failed to fetch data:', error);
//         return null; // throw error when something goes wrong when requesting data
//     }
// }


function updateSelect(id, data){
    const selectElement = document.getElementById(id);

    // Clear existing options (except the first one)
    for (let i = selectElement.options.length - 1; i > 0; i--) {
        selectElement.remove(i);
    }

    // Add new options
    data.forEach(play => {
        const option = document.createElement('option');
        option.value = play.playId; // Replace with a unique identifier from your play object
        option.text = play.playDescription; // Replace with the text you want to display
        selectElement.appendChild(option);
    });
}

/* Set the width of the side navigation to 250px */
function openNavLeft() {
    document.getElementById("sidenavLeft").style.width = "150px";
}

/* Set the width of the side navigation to 0 */
function closeNavLeft() {
    document.getElementById("sidenavLeft").style.width = "0";
}

function openNavRight() {
    document.getElementById("sidenavRight").style.width = "150px";
}

/* Set the width of the side navigation to 0 */
function closeNavRight() {
    document.getElementById("sidenavRight").style.width = "0";
}

// Use this to call either offensive or defensive view
function handleUserSelection () {
    fadeOutRegion();

    let selectedData = document.getElementById('statsType').value;

    console.log("Selected Data:", selectedData);

    if (selectedData === "offensive") {
        offensiveVis.updateVis();
    } else {
        offensiveVis.updateDefensiveVisualization();
    }

}


// PlayVisualization
// Get the button element
//
// let nextFrameButton = document.getElementById("playButton");
//
// // Add event listener
// nextFrameButton.addEventListener("click", function() {
//
//     for (let i = 0; i < 1000; i++) {
//         // Update the visualization
//         // playVis.updatePlayersPosition(playVis.currentFrame);
//         //
//         // // Next frame to draw
//         // playVis.currentFrame++;
//     }
// });
//
// let resetButton = document.getElementById("resetButton");
//
// resetButton.addEventListener("click", function() {
//     // playVis.updatePlayersPosition(playVis.currentFrame = 1);
// });



// Functionality for navbar
function navBarFunctionality() {
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', function () {
            const sectionId = dot.getAttribute('data-section');
            document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
        });
    });


}


// Append the image and title
function titleStyle() {

    d3.select("#section1").append("img")
        .attr("src", "data/images/nflfootball.jpg")
        .style("width", "100vw")
        .style("overflow", "hidden")
        .style("position", "absolute")
        .style("left", 0)
        .style("top", 0);

    d3.select("#section1").append("h1")
        .text("Superbowl Predictions")
        .style("font-size", "3em")
        .style("position", "absolute")
        .style("left", "50%")
        .style("top", "50%")
        .style("transform", "translate(-50%, -50%)")
        .style("opacity", "85%");
}

function fadeInRegion() {
    var regionRow = document.getElementById('regionRow');

    // Gradually increase opacity
    var opacity = 0;
    var interval = setInterval(function () {
        opacity += 0.05;
        regionRow.style.opacity = opacity;

        if (opacity >= 1) {
            clearInterval(interval);
        }
    }, 50);
}

function fadeOutRegion() {
    var regionRow = document.getElementById('regionRow');

    if (getComputedStyle(regionRow).opacity > '0') {
        var opacity = getComputedStyle(regionRow).opacity;
        var interval = setInterval(function () {
            opacity -= 0.05;
            regionRow.style.opacity = opacity;

            if (opacity <= 0) {
                clearInterval(interval);
            }
        }, 50);
    }
}
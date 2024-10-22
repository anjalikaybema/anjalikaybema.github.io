class TeamsVs {
    constructor(_parentElement, _teamAbbr) {
        this.parentElement = _parentElement;
        this.teams = _teamAbbr; // Expecting an array of two team abbreviations
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Define margins and dimensions
        vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };
        vis.width = 500 - vis.margin.left - vis.margin.right;
        vis.height = 200 - vis.margin.top - vis.margin.bottom;

        // Create SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        vis.svg.selectAll("*").remove();

        vis.displayLogos();
    }

    displayLogos() {
        let vis = this;

        // Display team logos and 'VS' text
        vis.teams.forEach((teamAbbr, index) => {
            vis.svg.append("image")
                .attr("xlink:href", "data/logosWeb/" + teamAbbr + ".webp")
                .attr("width", 100)
                .attr("height", 100)
                .attr("x", index * 200); // Adjust position based on index
        });

        // Display 'VS' text
        vis.svg.append("text")
            .attr("x", vis.width / 2 - 50)
            .attr("y", vis.height / 2)
            .text("VS")
            .style("fill", "white")
            .attr("font-size", "24px")
            .attr("text-anchor", "middle");
    }

    updateTeams(newTeams) {
        let vis = this;

        // Update the teams array
        vis.teams = newTeams;

        // update logos to display
        vis.wrangleData();
    }
}

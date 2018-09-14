// get .env values
require("dotenv").config();

// import spotify id and secret from keys file
const keys = require('./keys');
const Spotify = require('node-spotify-api');
const request = require('request');
const moment = require('moment');
const fs = require('fs');

let spotify = new Spotify(keys.spotify);
let spacer = '\n======================================================\n';

// determine liri command and call appropriate function
function parseArgs(args) {
    // liri command
    let command = args[2];
    let str = "";

    // convert args after command into one string
    for (let index = 3; index < args.length; index++) {
        const element = args[index];
        str += `${element} `;
    }

    // remove space at end of string
    str = str.substring(str, str.length - 1);

    // append command to file
    fs.appendFile('log.txt', `${spacer}Request: ${command} ${str}${spacer}`, (err) => {
        if (err) throw err;
    })

    // handle liri command
    switch (command) {
        case 'spotify-this-song':
            spotifySong(str);
            break;
        case 'concert-this':
            concertThis(str);
            break;
        case 'movie-this':
            movieThis(str);
            break;
        case 'do-what-it-says':
            fs.readFile('./random.txt', 'utf8', (err, data) => {
                if (err) throw err;

                let parsedData = data.split(',');
                parseArgs(['node', 'liri.js', parsedData[0], parsedData[1]]);
            });
            break;
        default:
            console.log('Enter a valid command:');
            console.log('  spotify-this-song <song name>');
            console.log('  concert-this <artist/band name>');
            console.log('  movie-this <movie name>');
            console.log('  do-what-it-says');
            break;
    }
}

// search spotify api for song and display relevant info
function spotifySong(song) {
    // default song
    if (song.trim() === "") {
        song = "The Sign";
    }

    spotify.search({ type: 'track', query: song, limit: 10 }, (err, data) => {
        if (err) {
            return console.log('Error occurred: ' + err);
        }

        console.log('======================================================');
        console.log('Spotify This Song');
        console.log('======================================================');

        for (const key in data.tracks.items) {
            if (data.tracks.items.hasOwnProperty(key)) {
                const element = data.tracks.items[key];
                let artists = "";

                element.artists.forEach(artist => {
                    artists += `${artist.name}, `;
                });;

                artists = artists.substring(0, artists.length - 2);

                console.log(`Artist(s): ${artists}`);
                console.log(`Song: ${element.name}`);
                console.log(`Link: ${element.external_urls.spotify}`);
                console.log(`Album: ${element.album.name}`);
                console.log('======================================================');

                let spotifyLog = `Artist(s): ${artists}\nSong: ${element.name}\nLink: ${element.external_urls.spotify}\nAlbum: ${element.album.name}${spacer}`

                fs.appendFile('log.txt', spotifyLog, (err) => {
                    if (err) throw err;
                });
            }
        }
    });
}

// search bandisintown api for artist/band and display relevant info
function concertThis(artist) {
    // default artist
    if (artist.trim() === "") {
        artist = "Rezz";
    }

    request(`https://rest.bandsintown.com/artists/${artist}/events?app_id=codingbootcamp`, (err, res, body) => {
        if (!err && res.statusCode === 200) {
            console.log('======================================================');
            console.log('Concert This');
            console.log('======================================================');
            for (const key in JSON.parse(body)) {
                if (JSON.parse(body).hasOwnProperty(key)) {
                    const element = JSON.parse(body)[key];

                    console.log(`Venue: ${element.venue.name}`);
                    // logic to determine if region/country are present and handle accordingly
                    console.log(`Location: ${element.venue.city}${element.venue.region === "" ? (element.venue.country === "" ? "" : ", " + element.venue.country) : ", " + element.venue.region}`);
                    // format date using moment package
                    console.log(`Date: ${moment(element.datetime).format("dddd, MMMM Do YYYY, h:mm a")}`);
                    console.log('======================================================');

                    let concertLog = `Venue: ${element.venue.name}\nLocation: ${element.venue.city}${element.venue.region === "" ? (element.venue.country === "" ? "" : ", " + element.venue.country) : ", " + element.venue.region}\nDate: ${moment(element.datetime).format("dddd, MMMM Do YYYY, h:mm a")}${spacer}`

                    fs.appendFile('log.txt', concertLog, (err) => {
                        if (err) throw err;
                    });
                }
            }
        }
    })
}

// search omdb api for movie and display relevant info
function movieThis(movie) {
    // default movie
    if (movie.trim() === "") {
        movie = "Mr. Nobody";
    }

    request(`http://www.omdbapi.com/?t=${movie}&y=&plot=short&apikey=trilogy`, (err, res, body) => {
        if (!err && res.statusCode === 200) {
            console.log('======================================================');
            console.log('Movie This');
            console.log('======================================================');

            const movieObj = JSON.parse(body);
            let rotten;

            console.log(`Title: ${movieObj.Title}`);
            console.log(`Year: ${movieObj.Year}`);
            console.log(`IMDb Rating: ${movieObj.imdbRating}`);
            // loop through ratings array until rotten tomatoes is found
            movieObj.Ratings.forEach(rating => {
                if (rating.Source === 'Rotten Tomatoes') {
                    rotten = rating.Value;
                    console.log(`Rotten Tomatoes Rating: ${rotten}`);
                }
            });
            console.log(`Country: ${movieObj.Country}`);
            console.log(`Language: ${movieObj.Language}`);
            console.log(`Plot: ${movieObj.Plot}`);
            console.log(`Actors: ${movieObj.Actors}`);
            console.log('======================================================');

            let concertLog = `Title: ${movieObj.Title}\nYear: ${movieObj.Year}\nIMDb Rating: ${movieObj.imdbRating}\nRotten Tomatoes Rating: ${rotten}\nCountry: ${movieObj.Country}\nLanguage: ${movieObj.Language}\nPlot: ${movieObj.Plot}\nActors: ${movieObj.Actors}${spacer}`

            fs.appendFile('log.txt', concertLog, (err) => {
                if (err) throw err;
            });
        }
    })
}

parseArgs(process.argv);


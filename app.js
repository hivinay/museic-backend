var express = require('express');
var bodyParser = require('body-parser');
var SpotifyWebApi = require('spotify-web-api-node');
var Promise = require('promise');

var code = process.env.SPOTIFY_ACCESS_CODE;

var app = express();
app.use(bodyParser.json());
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: 'https://localhost/callback'
});

console.log('Client ID: ' + process.env.SPOTIFY_CLIENT_ID);
console.log('Client Secret: ' + process.env.SPOTIFY_CLIENT_SECRET);

app.get('/auth', function(req, res) {
    res.json({
        url: spotifyApi.createAuthorizeURL([], 'state')
    });
});

app.post('/auth', function(req, res) {
    console.log(req.body);
    spotifyApi.authorizationCodeGrant(req.body.code)
        .then(function(data) {
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);
            res.json({
                access: data.body['access_token'],
                refresh: data.body['refresh_token']
            });
        }, function(err) {
            res.status(500);
            console.log('Something went wrong!', err); // Cannot get authorization
        });
});

function getSongByMood(mood) {
    return spotifyApi.searchPlaylists(mood)
        .then(function(res) {
            var allPlaylists = res.body.playlists.items.filter(function(playlist) {
                return (playlist.owner.id.indexOf('spotify') === 0); // Playlist creator is spotify*
            });
            var playlist = allPlaylists[Math.floor(Math.random() * allPlaylists.length)]; // Choose a random playlist
            console.log('Mood: %s \t Playlist User: %s \t Playlist ID: %s', mood, playlist.owner.id, playlist.id);
            return spotifyApi.getPlaylistTracks(playlist.owner.id, playlist.id)
                .then(function(res) {
                    var allTracks = res.body.items;
                    var track = allTracks[Math.floor(Math.random() * allTracks.length)]; // Choose a random track
                    console.log('Mood: %s \t Track: %s', mood, track.track.preview_url);
                    return track.track.preview_url;
                }, function(err) {
                    console.log('Track for playlist for mood %s cannot be processed.\n Error: %s', mood, err);
                    return false;
                });
        }, function(err) {
            console.log('Playlist for mood %s cannot be processed.\n Error: %s', mood, err);
            return false;
        });
}

app.get('/song', function(req, res) {
    spotifyApi.setAccessToken(req.headers['x-access-token']);
    spotifyApi.setRefreshToken(req.headers['x-refresh-token']);
    console.log('Access Token: %s \t Refresh Token: %s', req.headers['x-access-token'], req.headers['x-refresh-token']);

    Promise.all([
        getSongByMood('afternoon'),
        getSongByMood('pumped'),
        getSongByMood('relaxed')
    ]).then(function (tracks) {
        console.log(tracks[0], tracks[1], tracks[2]);
        var neutralTrack = tracks[0];
        var excitedTrack = tracks[1];
        var relaxedTrack = tracks[2];

        if (!neutralTrack || !excitedTrack || !relaxedTrack) {
            console.log('Error');
            res.status(500);
            res.json({
                status: 'error',
                body: 'Error with getting tracks.'
            });
        } else {

            console.log('Success');
            res.json({
                status: 'success',
                body: {
                    neutral: neutralTrack,
                    excited: excitedTrack,
                    relaxed: relaxedTrack
                }
            });
        }
        res.end();
    }).catch(console.error.bind(console));

});

var port = process.env.PORT || 3000;
var server = app.listen(port, function() {
    console.log('Listening on port %s.', port);
});

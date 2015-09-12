var express = require('express');
var SpotifyWebApi = require('spotify-web-api-node');

var code = process.env.SPOTIFY_ACCESS_CODE;
var access_token = process.env.SPOTIFY_ACCESS_TOKEN;
var refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

var app = express();
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    accessToken: access_token,
    refreshToken: refresh_token,
    redirectUri: 'https://localhost/callback'
});

console.log('Client ID: ' + process.env.SPOTIFY_CLIENT_ID);
console.log('Client Secret: ' + process.env.SPOTIFY_CLIENT_SECRET);

/*
spotifyApi.authorizationCodeGrant(code)
    .then(function(data) {

        console.log('The access token is ' + data.body['access_token']);
        console.log('The refresh token is ' + data.body['refresh_token']);
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
    }, function(err) {
        console.log('Something went wrong!', err); // Cannot get authorization
    });
 */

spotifyApi.refreshAccessToken()
    .then(function(data) {
        console.log('The access token has been refreshed!');
        console.log('The token expires in: ' + data.body['expires_in']);
    }, function(err) {
        console.log('Could not refresh access token', err);
    });

app.get('/', function(req, res) {
    spotifyApi.searchPlaylists('workout')
        .then(function(data) {
            var playlists = data.body.playlists.items;
            playlists.map(function(playlist) {
                console.log('User: ' + playlist.owner.id);
                console.log('ID: ' + playlist.id);

                // Get tracks in playlist
                spotifyApi.getPlaylistTracks(playlist.owner.id, playlist.id)
                    .then(function(tracks) { console.log(tracks); },
                          function(err) { console.log('Error: ' + err); }); // Cannot get tracks
            });
        }, function(err) {
            res.status(500);
            console.log('Something went wrong!', err); // Cannot get playlists
        });
});

/*
songza.station.get(1736950).then(function(val) {
  console.log(val);
});
*/

var server = app.listen(3000, function() {
    var port = server.address().port;
    console.log('Listening on port %s.', port);
});

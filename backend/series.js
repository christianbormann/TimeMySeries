var express = require('express');
var router = express.Router();
var request = require("request");
var sqlite3 = require("sqlite3").verbose();
var winston = require('winston');
var bodyParser = require('body-parser');
var tv = require('tvdb.js')('817906FA4DC931D2');


/* Configuration */
var config = require('../config');
var db = new sqlite3.Database(config.files.db);

/* Logger */
var logger = new (winston.Logger)({
    level: 'info',
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.files.log })
    ]
});

router.use(bodyParser.json());


/* Search for series name in local epg */
router.get('/searchnames/:seriesname', function (req, res) {
    
    var seriesname = req.params.seriesname;

    if (seriesname != "") {

        var url = 'http://'+config.receiver.ip+':'+config.receiver.webifport+'/api/epgsearch?search=' + seriesname;

        var responseObject = {};
        responseObject.message = "";
        responseObject.code = "";

        request({
            url: url,
            json: true
        }, function (error, response, body) {

            if (!error && response.statusCode === 200) {
                
                if (body.result == true) {

                    var resultnames = [];
                    
                    body.events.forEach(function(item) {
                        if (resultnames.indexOf(item.title) == -1) {
                            resultnames.push(item.title);
                        }                       
                    });

                    responseObject.message = "ok";
                    responseObject.code = "0";
                    responseObject.names = resultnames;

                    res.send(responseObject);

                }
                else {
                    responseObject.message = "Error: EPG search with errors.";
                    responseObject.code = "2";
                    res.send(responseObject);

                }

            }
            else {
                responseObject.message = "Error: Can't get result from EPG search.";
                responseObject.code = "2";
                res.send(responseObject);
            }
        })



    }
    else {
        responseObject.message = "Error: No search parameter given.";
        responseObject.code = "2";
        res.send(responseObject);
    }

});


// Get list of all saved series
router.get('/list', function (req, res) {
    
    db.all("SELECT id, name, fromseason FROM series", function(err, rows) {
        var responseObject = {};
        responseObject.message = "";
        responseObject.code = "";

        if (!err) {
            if (rows.length > 0) {
                responseObject.message = "ok";
                responseObject.code = "0";
                responseObject.series = rows;
                res.send(responseObject);
            } else {
                responseObject.message = "Error: No series found.";
                responseObject.code = "2";
                res.send(responseObject);
            }
        } else {
            responseObject.message = "Error: Could not connect to database.";
            responseObject.code = "2";
            res.send(responseObject);
        }
    });
});

/* Save series */
router.post('/save', function(req, res) {

    var err = false;

    var responseObject = {};
    responseObject.message = "";
    responseObject.code = "";
    
    var queries = [];

    req.body.series.forEach(function(seriesitem) {
        
        if (seriesitem.id == "n") {
            /* New series */
            queries.push("INSERT INTO series (name, fromseason) VALUES ('" + seriesitem.name + "', " + seriesitem.fromseason + ")"); 
        }
        else {
            /* Series always in db */  
            queries.push("UPDATE series SET name = '" + seriesitem.name + "', fromseason = " + seriesitem.fromseason + " WHERE id = " + seriesitem.id + "");              
        }
    });

    console.log(queries);

    var queryError = false;
    db.serialize(function() {
        queries.forEach(function(query) {
            db.run(query, function(err) {
                if (err) {
                    queryError = true;
                }
            });
        });
    }); 


    if (!queryError) {
        responseObject.message = "ok";
        responseObject.code = "0";
        res.send(responseObject);
    }
    else {
        responseObject.message = "Error: Could not save series data.";
        responseObject.code = "2";
        res.send(responseObject);
    }
});


/* Get episodes list from tvdb.com */
router.get('/getEpisodes/:seriesname/', function (req, res) {

    var seriesname = req.params.seriesname;

    var responseObject = {};
    responseObject.message = "";
    responseObject.code = "";

    var promiseGetToken = new Promise(function(resolve, reject) {

        request({
            url: 'http://timemyseries.sizco.de/api/gettoken.php',
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                if (body.token != "") {
                    resolve(body.token);
                }
                else {
                    reject(Error('Got empty token.'));
                }          
            }
            else {
                reject(error);
            }
        });
    });

    promiseGetToken.then(function(result) {
        // Got token for tvdb.com
        var token = result;

        // Search for series id on tvdb.com
        var promiseGetSeriesId = new Promise(function(resolve, reject) {
            request({
                headers: {
                    'Authorization' : 'Bearer ' + token,
                    'Accept-Language' : 'de'
                },
                url: 'https://api.thetvdb.com/search/series?name=' + seriesname
            }, function (errorSeries, responseSeries, bodySeries) {
                if (!errorSeries && responseSeries.statusCode === 200) {
                
                    var responseJSON = JSON.parse(bodySeries);
                    if (responseJSON.data[0].seriesName == seriesname) {
                            var seriesid = JSON.parse(bodySeries).data[0].id;
                            resolve(seriesid);
                    }
                    else {
                        reject(Error('Series not found on tvdb.com.'));
                    }
                }
                else {
                    reject(error);
                }

            });
        });

        promiseGetSeriesId.then(function(result) {
            // Got series id from tvdb.com
            var seriesid = result;
            
            // Get episode list from tvdb.com
            getEpisodes('https://api.thetvdb.com/series/' + seriesid + '/episodes?page=1', token).then(function(result) {

                if (result.pageNumbers > 1) {
                    var episodes = result.episodes;

                    var promiseArray = [];
                    for(var i = 2; i <= result.pageNumbers; i++){
                         promiseArray.push(getEpisodes('https://api.thetvdb.com/series/' + seriesid + '/episodes?page=' + i, token));
                    }

                    Promise.all(promiseArray).then(function(arrayOfResults) {
                        arrayOfResults.forEach(function(item) {
                            episodes.push(item.episodes);
                        });
                        responseObject.message = "ok";
                        responseObject.code = "0";
                        responseObject.episodes = episodes;
                        res.send(responseObject);

                    }, function() {
                        responseObject.message = "ERROR getting all episode pages from tvb.com.";
                        responseObject.code = "2";
                        res.send(responseObject);
                    });


                }
                else {
                    responseObject.message = "ok";
                    responseObject.code = "0";
                    responseObject.episodes = result.episodes;
                    res.send(responseObject);
                }
            }, function(err) {
                responseObject.message = "ERROR getting episdoe list from tvb.com.";
                responseObject.code = "2";
                res.send(responseObject);
            });

        }, function(err) {
            responseObject.message = "ERROR finding series on tvb.com.";
            responseObject.code = "2";
            res.send(responseObject); 
        });


    }, function(err) {
        responseObject.message = "ERROR getting token for tvb.com.";
        responseObject.code = "2";
        res.send(responseObject);
    });
});

function getEpisodes(url, token) {
    var promiseGetEpisodes = new Promise(function(resolve, reject) {
        request({
            headers: {
                'Authorization' : 'Bearer ' + token,
                'Accept-Language' : 'de'
            },
            url: url
        }, function (errorEpisodes, responseEpisodes, bodyEpisodes) {
            if (!errorEpisodes && responseEpisodes.statusCode === 200) {
            
                var responseJSON = JSON.parse(bodyEpisodes);
      
                var returnObject = {};
                returnObject.pageNumbers = responseJSON.links.last;
                returnObject.episodes = [];

                responseJSON.data.forEach(function(item) {
                    var episode = {};
                    episode.seasonnumber = item.airedSeason;
                    episode.episodenumber = item.airedEpisodeNumber;
                    episode.name = item.episodeName;
                    returnObject.episodes.push(episode);
                });

                resolve(returnObject);

            }
            else {
                reject(error);
            }

        });
    });
    return promiseGetEpisodes;
}



module.exports = router;
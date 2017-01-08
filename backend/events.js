var express = require('express');
var router = express.Router();
var request = require("request");
var sqlite3 = require("sqlite3").verbose();
var winston = require('winston');
var bodyParser = require('body-parser');
var tv = require('tvdb.js')('817906FA4DC931D2');
var async = require('async');

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


/* Search for events in local epg */
router.get('/:seriesname/:allowedseason?', function (req, res) {
    
    var seriesname = req.params.seriesname;
    var allowedseason = req.params.allowedseason;

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
                    

                    /* Get list of allowed services */
                    var urlServices = 'http://localhost:3000/api/services/list';
                    request({
                        url: urlServices,
                        json: true
                    }, function (errorServices, responseServices, bodyServices) {

                        if (bodyServices.message == "ok") {
                            var servicesRef = [];

                            bodyServices.services.forEach(function(service) {
                                if (service.selected == 1) {
                                    servicesRef.push(service.sref)
                                }
                            });


                            /* Get series info */
                           request({
                                url: 'http://localhost:3000/api/series/getEpisodes/' + seriesname,
                                json: true
                            }, function (errorEpisodes, responseEpisodes, bodyEpisodes) {
                                
                                if (bodyServices.message == "ok") {
                                  
                                    var events = [];
                                
                                    body.events.forEach(function(item) {
                                        if ((item.title.toUpperCase().indexOf((seriesname.toUpperCase() + ' ')) > -1) 
                                            || (item.title.toUpperCase() == seriesname.toUpperCase()))
                                        {
                                            var event = {};
                                            event.seriesname = seriesname;
                                            event.title = item.title;
                                            /* "Der verlorene Sohn, Crime-Serie, USA 2007" */
                                            episodename = item.shortdesc.split(", ")[0];
                                            if (episodename == '') {
                                                episodename = item.longdesc.split(". ")[0];
                                            }

                                            if (episodename != '') {
                                                event.episode = episodename;
                                                event.program = item.sname;
                                                event.begin = item.begin_timestamp;
                                                event.end = item.begin_timestamp + item.duration_sec;
                                                event.sref = item.sref;

                                                /* Check if timestamp is in future */
                                                if (event.begin >= (Date.now() / 1000 | 0)) {
                                                    
                                                    /* Add numbers from internet result */
                                                    if (bodyEpisodes.episodes) {
                                                        var searchresult = bodyEpisodes.episodes.find(function(episodeitem) {
                                                            return episodeitem.name.toUpperCase().indexOf(episodename.toUpperCase()) > -1
                                                                || episodeitem.name.toUpperCase() == episodename.replace(/\s?\((\d*)\)/g, ", Teil $1").toUpperCase(); // Trauma (2) --> Trauma, Teil 2
                                                        });
                                                        if(searchresult) {
                                                            event.seasonnumber = searchresult.seasonnumber;
                                                            event.episodenumber = searchresult.episodenumber;
                                                        }
                                                        else {
                                                            event.seasonnumber = 0;
                                                            event.episodenumber = 0;
                                                        }
                                                    }
                                                    else {
                                                        event.seasonnumber = 0;
                                                        event.episodenumber = 0;
                                                    }
                                                    
                                                    /* Check if is allowd service */
                                                    if (servicesRef.indexOf(item.sref) > -1) {
                                                        event.allowedservice = true;
                                                    } 
                                                    else {
                                                        event.allowedservice = false;
                                                    }   

                                                    /* Check if is allowed season */
                                                    if (allowedseason) {
                                                        if ((event.seasonnumber >= allowedseason) || (event.seasonnumber == 0)) {
                                                            event.allowedseason = true;
                                                        }
                                                        else {
                                                            event.allowedseason = false;
                                                        }
                                                    }
                                                    else {
                                                        event.allowedseason = false;
                                                    }

                                                    events.push(event);   
                                                }
                                            }             
                                        }                       
                                    });

                                    responseObject.message = "ok";
                                    responseObject.code = "0";
                                    responseObject.events = events;

                                    res.send(responseObject);

                                }
                                else {
                                    responseObject.message = "Error: Getting episode list with errors.";
                                    responseObject.code = "2";
                                    res.send(responseObject);
                                }
                            });

                        }
                        else {
                            responseObject.message = "Error: Services list with errors.";
                            responseObject.code = "2";
                            res.send(responseObject);

                        }

                    })

                        

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

function findEpisode(episodeitem, episodename) { 
    return episodeitem.name == episodename;
}

module.exports = router;
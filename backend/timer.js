var express = require('express')
var router = express.Router()
var request = require("request")
var bodyParser = require('body-parser');
var sqlite3 = require("sqlite3").verbose();

/* Configuration */
var config = require('../config');
var db = new sqlite3.Database(config.files.db);

router.use(bodyParser.json());

router.get('/list', function (req, res) {
  
    var url = 'http://'+config.receiver.ip+':'+config.receiver.webifport+'/api/timerlist';

    var responseObject = {};
    responseObject.message = "";
    responseObject.code = "";

    request({
        url: url,
        json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            
            if (body.result == true) {

                var timer = [];
                
                body.timers.forEach(function(item) {
                    
                    var timeritem =  {};
                    timeritem.name = item.name;
                    timeritem.begin = item.begin;
                    timeritem.end = item.end;
                    timeritem.servicename = item.servicename;
                    timeritem.description = item.description;
                    timeritem.sref = item.serviceref;

                    timer.push(timeritem);
                });

                responseObject.message = "ok";
                responseObject.code = "0";
                responseObject.timer = timer;

                res.send(responseObject);

            }
            else {
                responseObject.message = "Error: Timerlist from WebIf with errors.";
                responseObject.code = "2";
                res.send(responseObject);

            }

        }
        else {
            responseObject.message = "Error: Can't get timerlist from WebIf.";
            responseObject.code = "2";
            res.send(responseObject);
        }
    })
})


/* Add new timer */
router.post('/add', function(req, res) {

    var err = false;

    var responseObject = {};
    responseObject.message = "";
    responseObject.code = "";

    var event = req.body.event;

    var getProperties = { 
        sRef: event.sref, 
        end: event.end + 120,
        name: event.title + ' - S' + formatNumber(event.seasonnumber) + 'E' + formatNumber(event.episodenumber) + ' - ' + event.episode,
        description: 'S' + formatNumber(event.seasonnumber) + 'E' + formatNumber(event.episodenumber) + ' - ' + event.episode,
        disabled: 0,
        afterevent: 3, 
        tags: 'TimeMySeries',
        repeated: 0,
        justplay: 0,
        vpsplugin_enabled: 0,
        vpsplugin_overwrite: 1,
        begin: event.begin -120
    };

    var url = 'http://'+config.receiver.ip+':'+config.receiver.webifport+'/api/timeradd';

    request({
        url: url,
        json: true, 
        qs: getProperties
    }, function (error, response, body) {

        
        if (!error && response.statusCode === 200) {
            
            if (body.result == true) {

                /* Add episode as timed to db */
                var query = "INSERT INTO recorded_episodes (seriesname, series_id, episodename, season, episode) VALUES ('" + event.seriesname + "', (SELECT id FROM series WHERE name = '" + event.seriesname + "'), '" + event.episode + "', " + event.seasonnumber + ", " + event.episodenumber + ")";

                db.serialize(function() {
                    db.run(query, function(err) {
                        if (!err) {
                            responseObject.message = body.message;
                            responseObject.code = "0";
                            res.send(responseObject);
                        }
                        else {
                            responseObject.message = "Error: " + err.message;
                            responseObject.code = "2";
                            res.send(responseObject);
                        }
                    });
                }); 
  
            }
            else {
                responseObject.message = body.message;
                responseObject.code = "2";
                res.send(responseObject);
            }
    
        }
        else {
            responseObject.message = "Error: Could not add timer.";
            responseObject.code = "2";
            res.send(responseObject);
        }

    });
});


/* Delete timer */
router.post('/delete', function(req, res) {

    var err = false;

    var responseObject = {};
    responseObject.message = "";
    responseObject.code = "";

    var timer = req.body.timer;
/*
sRef:1:0:19:7C:A:85:C00000:0:0:0:
begin:1483869180
end:1483872120
_:1483805013546*/

    var getProperties = { 
        sRef: timer.sref, 
        end: timer.end,
        begin: timer.begin
    };

    var url = 'http://'+config.receiver.ip+':'+config.receiver.webifport+'/api/timerdelete';

    request({
        url: url,
        json: true, 
        qs: getProperties
    }, function (error, response, body) {

        
        if (!error && response.statusCode === 200) {
            
            if (body.result == true) {
                responseObject.message = body.message;
                responseObject.code = "0";
                res.send(responseObject);
            }
            else {
                responseObject.message = body.message;
                responseObject.code = "2";
                res.send(responseObject);
            }
    
        }
        else {
            responseObject.message = "Error: Could not delete timer.";
            responseObject.code = "2";
            res.send(responseObject);
        }

    });
});

function formatNumber(n) {
    return (n < 10) ? ("0" + n) : n;
}

module.exports = router
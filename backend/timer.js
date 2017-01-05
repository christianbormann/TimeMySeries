var express = require('express')
var router = express.Router()
var request = require("request")

var config = require('../config');


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




// define the about route
router.delete('/delete', function (req, res) {
  res.send('Delete timer')
})

module.exports = router
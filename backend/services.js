var express = require('express');
var router = express.Router();
var request = require("request");
var sqlite3 = require("sqlite3").verbose();
var winston = require('winston');
var bodyParser = require('body-parser');

/* Configuration */
var config = require('../config');
var db = new sqlite3.Database(config.files.db);


function servicesToDb() {

    var url = 'http://'+config.receiver.ip+':'+config.receiver.webifport+'/api/getallservices';
    
    request({
        url: url,
        json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
           
            if (body.result == true) {
                
                body.services.forEach(function(bouquetitem) {
                     
                    bouquetitem.subservices.forEach(function(item) {
             
                        if ((item.servicename != "<n/a>") && (item.servicename != ".")) {

                            db.all("SELECT * FROM services WHERE sref = '" + item.servicereference + "'", function(err, rows) {
                                if (rows.length == 0) {
                                    db.run("INSERT INTO services (name, sref) VALUES ('" + item.servicename + "', '" + item.servicereference + "')", function(err, rows) {
                                        if(err) {
                                            console.log(err);
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            }
        }
    });
}


router.get('/list', function (req, res) {
    
    servicesToDb();
    services = [];

    var responseObject = {};
    responseObject.message = "";
    responseObject.code = "";

    db.all("SELECT * FROM services ORDER by name", function(err, rows) {

        if (!err) {
            if (rows.length > 0) {
                responseObject.message = "ok";
                responseObject.code = "0";
                responseObject.services = rows;
                res.send(responseObject);
            } else {
                responseObject.message = "Error: No services found.";
                responseObject.code = "2";
                res.send(responseObject);
            }
        } else {
            responseObject.message = "Error: Could not connect to database.";
            responseObject.code = "2";
            res.send(responseObject);
        }

        
    });

})


router.post('/:id', function (req, res) {
    var id = req.params.id;
    
    var responseObject = {};
    responseObject.message = "";
    responseObject.code = "";

    db.run("UPDATE services SET selected = (CASE selected WHEN 1 THEN 0 ELSE 1 END) WHERE id = " + id, function(err, rows) {

    if (!err) {
        responseObject.message = "ok";
        responseObject.code = "0";
        res.send(responseObject);
        
    } else {
        responseObject.message = "Error: Could not connect to database.";
        responseObject.code = "2";
        res.send(responseObject);
    }

        
    });
});

// define the about route
router.delete('/delete', function (req, res) {
  res.send('Delete timer')
})

module.exports = router
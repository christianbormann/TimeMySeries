'use strict';

var config = require('./config');

/* Modules */
var express = require('express')
var winston = require('winston');
var sqlite3 = require("sqlite3").verbose();
var fs = require("fs");

/* Logger */
var logger = new (winston.Logger)({
    level: 'info',
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.files.log })
    ]
});

/* Create db, if not exist */
var file = config.files.db;
var exists = fs.existsSync(file);
var db = new sqlite3.Database(file);

db.serialize(function() {
  if(!exists) {
    db.run("CREATE TABLE series (id	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, name TEXT, fromseason INTEGER DEFAULT 1)");
    db.run("CREATE TABLE services (id	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, name TEXT, sref TEXT, selected INTEGER DEFAULT 0)");
    db.run("CREATE TABLE recorded_episodes (id	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, seriesname TEXT, series_id INTEGER, episodename TEXT, season INTEGER, episode INTEGER, FOREIGN KEY(series_id) REFERENCES series(id) ON DELETE CASCADE)");
  }

  /* Set foreign key handling for sqlite */
  db.exec('PRAGMA foreign_keys = ON', function(err) {
    if (!err) {
      /* Do nothing */
    } else {
      logger.error("Could not set PRAGMA");
    }
  });
});


/* Web Application */
var app = express();

/* Express Routes */
var timer = require('./backend/timer');
app.use('/api/timer', timer);

var series = require('./backend/series');
app.use('/api/series', series);

var services = require('./backend/services');
app.use('/api/services', services);

var events = require('./backend/events');
app.use('/api/events', events);


/* Frontend: Static */
app.use(express.static("./frontend"));


app.set('port', config.webserver.port);

var server = app.listen(app.get('port'), function() {
  var port = server.address().port;
  logger.info("Webserver started on Port " + port);
});

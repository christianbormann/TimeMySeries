var config = {};

config.receiver = {
  ip: "192.168.0.30",
  webifport: 80
}

config.webserver = {
  port: 3000
};

config.files = {
  db: "db/db.sqlite",
  log: "logs/app.log",
};

module.exports = config;

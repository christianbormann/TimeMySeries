var config = {};

config.global = {
  packageSize: 10
};

config.receiver = {
  ip: "192.168.0.30",
  webifport: 80
}

config.webserver = {
  port: 3000
};

config.directories = {
  data: "data/",
  orders: "data/orders/",
  products: "data/products/",
  templates: "data/templates/",
  frontend: "frontend/"
};

config.files = {
  db: "db/db.sqlite",
  log: "logs/app.log",
  orders: "bestellung.csv",
  codes: "qrcodes.csv"
};

module.exports = config;

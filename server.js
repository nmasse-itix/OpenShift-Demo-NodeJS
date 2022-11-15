const client = require('prom-client')
const promBundle = require("express-prom-bundle");
var express = require("express");
var app = express();
var router = express.Router();
var port = 8080;

// See https://www.w3schools.com/cssref/css_colors.asp
var color = "green";
var ready = false;

router.use(function (req,res,next) {
  next();
  console.log("%s %s => %i", req.method, req.originalUrl, res.statusCode);
});

// Prometheus exporter
const registry = new client.Registry()
const metricsMiddleware = promBundle({
  includeMethod: true, 
  includePath: true, 
  includeStatusCode: true, 
  includeUp: true,
  customLabels: {app: 'openshift-demo-nodejs'},
  promClient: {
    collectDefaultMetrics: {
    }
  }
});
app.use(metricsMiddleware)
const counter = new client.Counter({
  name: 'openshift_demo_nodejs_calls',
  help: 'Number of calls to the OpenShift-Demo-NodeJS',
});
registry.registerMetric(counter);

router.get("/",function(req,res){
  res.sendFile(__dirname + '/views/index.html');
});

router.get("/info",function(req,res){
  var status = 200;
  var response = {
    color: color,
    podName: process.env["HOSTNAME"],
  };
  if (!ready) {
    response.color = "red";
    response.podName = "NOT READY";
    status = 503;
  } else {
    counter.inc();
  }
  res.type('application/json')
     .header("Connection", "close")
     .header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
     .header('Expires', '-1')
     .header('Pragma', 'no-cache')
     .status(status)
     .send(JSON.stringify(response))
     .end();
});

// Liveness probe
router.get("/health/live",function(req,res){
  res.type('application/json')
     .send({"alive": true})
     .end();
});

// Readiness probe
router.get("/health/ready",function(req,res){
  if (ready) {
    res.type('application/json')
    .send({"alive": true})
    .end();
  } else {
    res.status(503).send("Not ready");
  }
});

app.use("/",router);

app.use("*",function(req,res){
  res.status(404).send("Not found");
});

console.log("Starting up...");

setTimeout(function(){
  app.listen(port,function(){
    console.log("Live at Port %i", port);
  });
}, 15000);

setTimeout(function(){
  ready = true;
}, 30000);

//app.listen(port,function(){
//  console.log("Live at Port %i", port);
//});

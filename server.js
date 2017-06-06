var express = require("express");
var app = express();
var router = express.Router();
var port = 8080;

var color = "red";

router.use(function (req,res,next) {
  next();
  console.log("%s %s => %i", req.method, req.originalUrl, res.statusCode);
});

router.get("/",function(req,res){
  res.sendFile(__dirname + '/views/index.html');
});

router.get("/info",function(req,res){
  var response = {
    color: color,
    podName: process.env["HOSTNAME"],
  };
  res.type('application/json').send(JSON.stringify(response));
});


app.use("/",router);

app.use("*",function(req,res){
  res.status(404).send("Not found");
});

app.listen(port,function(){
  console.log("Live at Port %i", port);
});

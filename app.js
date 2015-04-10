// Load npm modules
	
	var express = require("express"),
		cookieParser = require("cookie-parser"),
		bodyParser = require("body-parser"),
		session = require("express-session"),
		mongoose = require("mongoose"),
		io = require("engine.io"),
		redis = require("redis"),
		passport = require("passport"),
		path = require("path"),
		LocalStrategy = require("passport-local").Strategy;

// Load config 

	global.config = require(path.join(__dirname, "package.json")).config;
	
// Load custom modules

	global.email = require("./node-data-access/helpers/email.js");	
	global.dataError = require("./node-data-access/helpers/data-error.js");
	global.mimeTypes = require("./node-data-access/helpers/mime-extensions.js");
	global.security = require("./node-data-access/helpers/security.js");
	global.utils = require("./node-data-access/helpers/utils.js");

	
// Instantiate Express

	var app = express();
	
// Configure Express		

	app.set("view engine", "ejs");

	// app
  	app.use("/app", express.static(__dirname + "/app"));
  	
	// static resources that don't need compiling
	app.use("/libs", express.static(__dirname + "/assets/libs"));
	app.use("/img", express.static(__dirname + "/assets/img"));	
	app.use("/styles", express.static(__dirname + "/assets/styles"));
	
  	app.use(function(req, res, next) {
    	res.header("Access-Control-Allow-Origin", "*");
    	res.header("Access-Control-Allow-Headers", "X-Requested-With");
    	next();
  	});
	
	app.use(cookieParser());
	app.use(bodyParser.urlencoded({ extended: true, limit: "5mb" }));
	app.use(bodyParser.json({ limit: "5mb" }));
	app.use(session({ secret: config.sessionID, saveUninitialized: true, resave: true }));
	app.use(passport.initialize());
	app.use(passport.session());

// Create the http server and attach engine.io to it
	
	var http = require("http").createServer(app).listen(3000);
	
	var socket = io.attach(http);

	/*process.on("uncaughtException", function(err) {
		console.log("************************** UNCAUGHT EXCEPTION: " + err);
	});*/

// Connect to the mongo database

	var db = mongoose.connection;

	db.on('connecting', function() {
		console.log('connecting to MongoDB...');
	});

	db.on('error', function(error) {
		console.error('Error in MongoDb connection: ' + error);
		mongoose.connect(config.mongoAddress, { server: { auto_reconnect: true } });
	});

	db.on('connected', function() {
		console.log('MongoDB connected!');
	});

	db.once('open', function() {
		console.log('MongoDB connection opened!');
	});

	db.on('reconnected', function () {
		console.log('MongoDB reconnected!');
	});

	db.on('disconnected', function() {
		console.log('MongoDB disconnected!');
		mongoose.connect(config.mongoAddress, { server: { auto_reconnect: true } });
	});

	mongoose.connect(config.mongoAddress, { server: { auto_reconnect: true } });

// Set up the data access controllers

	var users = require("./node-data-access/controllers/users");
	var workspaces = require("./node-data-access/controllers/workspaces");
	var boards = require("./node-data-access/controllers/boards");
	var boardCards = require("./node-data-access/controllers/boardCards");
	var boardClusters = require("./node-data-access/controllers/boardClusters");
	var hints = require("./node-data-access/controllers/hints");
	var chat = require("./node-data-access/controllers/chat");

// Configure the Amazon client access key

	global.authenticateAmazonS3 = function() {
		var knox = require("knox");

		return knox.createClient({ key: config.amazonKey, secret: config.amazonSecret, bucket: config.amazonBucket });
	}
	
// Passport authenitcation	
	
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});
	
	passport.deserializeUser(function(id, done) {
		users.getById(id, function(err, user) {
			done(err, user);
		});
	});
	
	passport.use(new LocalStrategy({ passReqToCallback: true },
		function(req, username, password, done) {
			if (req.isAuthenticated()) {
				var canPasswordProtectBoard = false;

				if(req.user.roles) { 
					for (var i=0; i<req.user.roles.length; i++) {
						for (var j=0; j<userRoles.length; j++) {
							if (req.user.roles[i].trim().toLowerCase() == userRoles[j].trim().toLowerCase()) {
								canPasswordProtectBoard = true;
							}
						}
					}
				}

				var authenticatedUser = {
					_id: req.user._id, 
					sessionId: req.user.sessionId,
					username: req.user.username,
					email: req.user.email,
					canPasswordProtectBoard: canPasswordProtectBoard,
					joined: req.user.joined
				}	 
				     
				return done(null, authenticatedUser);
			}
			else if ((username) && (password) && (username.trim().length > 0) && (password.trim().length > 0)) {
				users.getByEmail(username, function(err, user) {
					if (err) return done(err, false, { message: "Incorrect username." });

					if (!user) return done(null, false, { message: "Incorrect username." });

					if (!security.comparePasswords(password, user.password)) return done(null, false, { message: "Incorrect password." });

					var canPasswordProtectBoard = false;

					if(user.roles) { 
						for (var i=0; i<user.roles.length; i++) {
							for (var j=0; j<userRoles.length; j++) {
								if (user.roles[i].trim().toLowerCase() == userRoles[j].trim().toLowerCase()) {
									canPasswordProtectBoard = true;
								}
							}
						}
					}

					user.canPasswordProtectBoard = canPasswordProtectBoard;

					if (!user.sessionId) {
						var sessionId = utils.createGUID();
						user.sessionId = sessionId;

						users.saveSessionId(user._id, sessionId);
					}

					return done(null, user);
				});
			}
			else {
				var cookies = utils.parseCookies(req);;

				if(cookies[config.cookieID]) {
					users.getBySessionId(cookies[config.cookieID], function(err, user) {
						if ((err) || (!user)) return done(null, null);
						else {
							var canPasswordProtectBoard = false;

							if(user.roles) { 
								for (var i=0; i<user.roles.length; i++) {
									for (var j=0; j<userRoles.length; j++) {
										if (user.roles[i].trim().toLowerCase() == userRoles[j].trim().toLowerCase()) {
											canPasswordProtectBoard = true;
										}
									}
								}
							}

							user.canPasswordProtectBoard = canPasswordProtectBoard;

							return done(null, user);
						}
					});
				}
				else return done(null, null);
			}
		}
	));

// REST Routes

	app.get("/*", function(req, res, next) {
		if (req.headers.host.match(/^www\./) != null) res.redirect("http://" + req.headers.host.slice(4) + req.url, 301);
		else next();
	});

// Actions for user authentication

	app.post("/auth", function(req, res, next) {
		if (req.isAuthenticated()) req.logout();

		passport.authenticate("local", function(err, user, info) {
			if (err) return res.send({ status: "401", message: err.message});
			else if (!user) return res.send({ status: "401", message: info.message});
			else {
				req.logIn(user, function(err) {
					if (err) return res.send({ status: "401", message: err.message});

					user.password = null;

					return res.send({ code: 200, user: user });
				});
			}
		})(req, res, next);
	});
	
	app.delete("/auth", function(req, res, next) {
		req.logout();
		req.session.destroy();

		return res.send({ code: 200 });
	});
	
	app.get("/checkAuthenticated", function(req, res, next) {
	 	security.checkAuthenticated(req, res, function(user) {
			if (user) {
				return res.send({ code: 200, user: user });
			}
			else {
				return res.send({ status: "401" });
			}
		});
	});

// Main actions

	app.get("/", function(req,res) { 
		res.render("index", { title: 'BoardThing' }); 
	});
	
	app.get("/login", function(req,res) {
		security.checkAuthenticated(req, res, function(user) {
			if (user) res.redirect("/main");
			else res.render("index", { title: 'BoardThing' });
		});
	});
	
	app.get("/signup", function(req,res) {
		security.checkAuthenticated(req, res, function(user) {
			if (user) res.redirect("/main");
			else res.render("index", { title: 'BoardThing' });
		});
	});
	
	app.get("/main", function(req,res) { 
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) res.render("index", { title: 'BoardThing' });
				else res.redirect("/login");
			});
		}
		else {
			res.render("index", { title: 'BoardThing' }); 
		}
	});

	app.get("/workspace/:id", function(req,res) { 
		res.render("index", { title: 'BoardThing' }); 
	});

	app.get("/reset/:id", function(req,res) { 
		res.render("index", { title: 'BoardThing' }); 
	});

	app.get("/resetPassword/:id", function(req,res) { 
		res.render("index", { title: 'BoardThing' }); 
	});

// Card add hint actions

	app.get("/users/getDisplayCardAddHint", function(req,res) { 
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) users.getDisplayCardAddHint(req,res);
				else {
					dataError.log({
						model: "users",
						action: "getDisplayCardAddHint",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else {
			users.getDisplayCardAddHint(req,res);
		}
	});

	app.put("/users/disableDisplayCardAddHint", function(req,res) { 
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) users.disableDisplayCardAddHint(req,res);
				else {
					dataError.log({
						model: "users",
						action: "disableDisplayCardAddHint",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else {
			users.disableDisplayCardAddHint(req,res);
		}
	});
	
// User password actions

	app.post("/users/resetPassword/:id", users.resetPassword);

	app.put("/users/sharedBoards/:boardId", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user)users.updateSharedBoards(req,res);
				else {
					dataError.log({
						model: "users",
						action: "updateSharedBoards",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else users.updateSharedBoards(req,res);
	});

	app.post("/users/sendPassword", users.sendUserPassword);

// User actions

	app.get("/users", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) users.get(req,res);
				else {
					dataError.log({
						model: "users",
						action: "get",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else users.get(req,res);
	});

	app.post("/users", users.insert);

	app.put("/users/:id", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) users.update(req,res);
				else {
					dataError.log({
						model: "users",
						action: "update",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else {
			users.update(req,res);
		}
	});

// Board actions
	

// Actions for doing a general ger on the board. Retrieves the board layout.

	app.get("/workspace", function(req,res) { 
		hints.getWorkspaceHint(function(hint) {
			res.render("index", { hint: hint });
		});
	});
	
	app.get("/workspace/:id", function(req,res) {
		hints.getWorkspaceHint(function(hint) {
			res.render("index", { hint: hint });
		});
	});

// Get all the boards for the currently authenticated user

	app.get("/workspaces", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) workspaces.getAll(req,res);
				else {
					dataError.log({
						model: "workspaces",
						action: "getAll",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else workspaces.getAll(req,res);
	});

// Get all the boards for the currently authenticated user

	app.post("/workspaces", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) workspaces.insert(req,res);
				else {
					dataError.log({
						model: "workspaces",
						action: "insert",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else workspaces.insert(req,res);
	});
	
// Get a requested workspace

	app.get("/workspaces/:id", workspaces.get);

/* // Called when a user does a "Save As"

	app.post("/boards/:boardId", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) {
					boards.saveAs(req,res);
				}
				else {
					dataError.log({
						model: "boards",
						action: "saveAs",
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else {
			boards.saveAs(req,res);
		}
	}); */

	// Updates a workspace password

	app.put("/workspaces/updatePassword/:id", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) workspaces.updatePassword(req,res);
				else {
					dataError.log({
						model: "workspaces",
						action: "updatePassword",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else workspaces.updatePassword(req,res);
	});

	app.post("/workspace/authenticate/:id", workspaces.authenticateWorkspace);

	app.put("/workspace/boardPositions/:id", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) workspaces.updateBoardPositions(req,res);
				else {
					dataError.log({
						model: "boards",
						action: "update",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else workspaces.updateBoardPositions(req,res);
	});

	app.post("/workspace/boards/:id", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) boards.insert(req,res);
				else {
					dataError.log({
						model: "boards",
						action: "insert",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else boards.insert(req,res);
	});

// Actions for manipulating boards

	app.put("/workspace/boards/position/:workspaceId/:id", boards.updatePosition);

	// Actions for storing what people have drawn on a board (Store HTML canvas as a flat image)

	app.get("/boards/background/:workspaceId/:id", boards.getBackground);
	app.put("/boards/background/:workspaceId/:id", boards.updateBackground);

	/* app.get("/boards/export/:id/:format", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) {
					boards.export(req,res);
				}
				else {
					dataError.log({
						model: "boards",
						action: "export",
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else {
			boards.export(req,res);
		}
	}); */

	app.put("/boards/:id", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) {
					boards.update(req,res);
				}
				else {
					dataError.log({
						model: "boards",
						action: "update",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else {
			boards.update(req,res);
		}
	});

	app.delete("/workspace/boards/:id", function(req,res) {
		if (!req.isAuthenticated()) {
			security.checkAuthenticated(req, res, function(user) {
				if (user) boards.delete(req,res);
				else {
					dataError.log({
						model: "boards",
						action: "delete",
						code: 401,
						msg: "Unauthorized access",
						res: res
					});
				}
			});
		}
		else boards.delete(req,res);
	});
	
// Actions for manipulating cards and clusters on a board

	app.get("/workspace/boards/cards/:boardId", boardCards.get);

	app.post("/workspace/boards/cards/text/:workspaceId/:boardId", boardCards.insertText);
	app.put("/workspace/boards/cards/text/:workspaceId/:boardId/:cardId", boardCards.updateText);

	app.get("/workspace/boards/cards/image/:workspaceId/:boardId/:cardId", boardCards.getImage);
	app.post("/workspace/boards/cards/image/:workspaceId/:boardId", boardCards.insertImage);
	app.put("/workspace/boards/cards/image/:workspaceId/:boardId/:cardId", boardCards.updateImage);
	app.post("/workspace/boards/cards/downloadImage/:workspaceId/:boardId", boardCards.downloadImage);

	app.post("/workspace/boards/cards/duplicate/:workspaceId/:boardId/:cardId", boardCards.duplicate);
	app.delete("/workspace/boards/cards/:workspaceId/:boardId/:cardId", boardCards.delete);
	
	app.put("/workspace/boards/cards/board/:workspaceId/:boardId/:cardId", boardCards.setBoard);
	
	app.put("/workspace/boards/cards/lock/:workspaceId/:boardId/:cardId", boardCards.lock);
	app.put("/workspace/boards/cards/unlock/:workspaceId/:boardId/:cardId", boardCards.unlock);

	app.put("/workspace/boards/cards/resize/:workspaceId/:boardId/:cardId", boardCards.updateDimensions);
	app.put("/workspace/boards/cards/position/:workspaceId/:boardId/:cardId", boardCards.updatePosition);
	app.put("/workspace/boards/cards/zindex/:workspaceId/:boardId", boardCards.updateZIndex);
	
	app.get("/boards/chat/:workspaceId/:boardId", chat.get);
	app.post("/boards/chat/:workspaceId/:boardId", chat.insert);
	
	app.post("/workspace/boards/clusters/:workspaceId/:boardId/:clusterId", boardClusters.attachClusterToMain);
	app.put("/workspace/boards/clusters/:workspaceId/:boardId/:clusterId", boardClusters.update);
	app.delete("/workspace/boards/clusters/:workspaceId/:boardId/:clusterId", boardClusters.delete);
	
	app.post("/workspace/boards/clusters/cards/:workspaceId/:boardId/:clusterId/:cardId", boardClusters.attachCard);
	app.delete("/workspace/boards/clusters/cards/:workspaceId/:boardId/:clusterId/:cardId", boardClusters.detachCard);
	app.post("/workspace/boards/clusters/clusters/:workspaceId/:boardId/:parentclusterId/:childclusterId", boardClusters.attachCluster);
	app.delete("/workspace/boards/clusters/clusters/:workspaceId/:boardId/:parentclusterId/:childclusterId", boardClusters.detachCluster);
	
	app.put("/workspace/boards/clusters/expand/:workspaceId/:boardId/:clusterId", boardClusters.expand);
	app.put("/workspace/boards/clusters/collapse/:workspaceId/:boardId/:clusterId", boardClusters.collapse);
	app.put("/workspace/boards/clusters/sort/:workspaceId/:boardId/:clusterId", boardClusters.sort);

	app.put("/workspace/boards/clusters/startVoting/:workspaceId/:boardId/:clusterId", boardClusters.startDotVoting);
	app.put("/workspace/boards/clusters/stopVoting/:workspaceId/:boardId/:clusterId", boardClusters.stopDotVoting);
	app.post("/workspace/boards/clusters/addVote/:workspaceId/:boardId/:cardId", boardCards.addVote);
	app.delete("/workspace/boards/clusters/removeVotes/:workspaceId/:boardId/:cardId", boardCards.removeVotes);

	// Catch any occuring client errors

	app.post("/clientError", function(req,res) {
		var dayPadded = ("00" + (new Date()).getDate());
		var monthPadded = ("00" + (new Date()).getMonth());
		var hourPadded = ("00" + (new Date()).getHours());
		var minutesPadded = ("00" + (new Date()).getMinutes());

		console.log("************************** CLIENT ERROR: " + dayPadded.substring(dayPadded.length-2) + "-" + monthPadded.substring(monthPadded.length-2) + "-" + (new Date()).getFullYear() + " " + hourPadded.substring(hourPadded.length-2) + ":" + minutesPadded.substring(minutesPadded.length-2));
		console.log("Error: " + req.body.error);
		console.log("LineNo: " + req.body.line);
		console.log("Client: " + req.body.client + " " + req.body.version);	
		console.log("*********************************************************************************");
	});

// Actions for sockets without redis
	
	if (global.global.workspaceConnections == null) global.global.workspaceConnections = {};
	
	var pub = redis.createClient();
	generatePublicationActions();
	
	var sub = redis.createClient();
	var refreshIntervalId = null;	
	generateSubscriptionActions();

// Create socket connection and configure to publish through Redis
	
	socket.on("connection", function (client) {
		client.send("123456");

		client.on("message", function (data) {
			if ((data) && (data.trim().length > 0)) {
				var packageData = null;

				try {
					packageData = JSON.parse(data);
				}
				catch (ex) {
					console.log("Application: Error receiving package: " + ex.toString());
				}

				if ((packageData) && (packageData.workspace)) {
					packageData.sendingClientId = client.id;

					data = JSON.stringify(packageData);

					if (!(packageData.workspace in global.workspaceConnections)) global.workspaceConnections[packageData.workspace] = {
						lastAccessed: new Date,
						connections: []
					};

					var connectionRecorded = false;

					for (var i=0; i<global.workspaceConnections[packageData.workspace].connections.length; i++) {
						if (global.workspaceConnections[packageData.workspace].connections[i] == client.id) {
							connectionRecorded = true;
							global.workspaceConnections[packageData.workspace].lastAccessed = new Date;
							break;
						}
					}

					if (!connectionRecorded) {
						global.workspaceConnections[packageData.workspace].lastAccessed = new Date;
						global.workspaceConnections[packageData.workspace].connections.push(client.id);
					}

					try {
						pub.publish(config.socketID, data);
					}
					catch (err) {
						console.log("Application: Error publishing: " + err);
					}
				}
			}
		});
	
		client.on("close", function () {
			for (var workspaceId in global.workspaceConnections) {
				do {  
					var containedConnection = false;
					for (var i=0; i<global.workspaceConnections[workspaceId].connections.length; i++) {
						if (global.workspaceConnections[workspaceId].connections[i] == client.id) {
							global.workspaceConnections[workspaceId].connections.splice(i,1);
							containedConnection = true;
							break;
						}
					}
				}
				while (containedConnection);	

				if (global.workspaceConnections[workspaceId].connections.length == 0) {
					delete global.workspaceConnections[workspaceId];
				}
			}
		});
	
		client.on("error", function (err) {
			console.log("Websocket error occured: " + err);
		});
	});

// Functions for handling redis actions. Done this way to handle redis crashes

	function generatePublicationActions() {
		pub.on("ready", function() {});	
		pub.on("end", function() {});	
		pub.on("error", function(e) {
			console.log("Application: Publication error: " + e.toString());
			pub = redis.createClient();	
			generatePublicationActions();
		});
	}
	
	function generateSubscriptionActions()  {
		sub.on("ready", function() {
			sub.subscribe(config.socketID);

			console.log("Application: Subscribed to messages :)");

			if (refreshIntervalId != null) clearInterval(refreshIntervalId);

			refreshIntervalId = setInterval(function() {
				for (var workspaceId in global.workspaceConnections) {
					if (Math.round(Math.abs(((new Date).getTime() - global.workspaceConnections[workspaceId].lastAccessed.getTime())/(60*60*1000))) >= 1) delete global.workspaceConnections[workspaceId];
				}
				
				sub.subscribe(config.socketID);
			}, (10*60000));

			sub.on("message", function(channel, message) {
				if ((message) && (message.trim().length > 0)) {
					var packageData = null;

					try {
						packageData = JSON.parse(message);
					}
					catch (ex) {
						console.log("Application: Error receiving messages: " + ex.toString());
					}

					if ((packageData) && (packageData.workspace)) {
						if (packageData.workspace in global.workspaceConnections) {
							for (var i=0; i<global.workspaceConnections[packageData.workspace].connections.length; i++) {   
								if(typeof packageData.sendingClientId !== "undefined") {
									// Don't broadcast to sending client
									if(global.workspaceConnections[packageData.workspace].connections[i] == packageData.sendingClientId ) {
										continue;
									}
								}

								if (socket.clients[global.workspaceConnections[packageData.workspace].connections[i]]) {
									socket.clients[global.workspaceConnections[packageData.workspace].connections[i]].send(message);
								}
							}
						}
					}
				}
			});
		});

		sub.on("end", function() {
			console.log("Application: No longer subscribed to messages :(");
		});

		sub.on("error", function(e) {
			console.log("Application: Subscription Error: " + e.toString());	
			
			sub = redis.createClient();	
			if (refreshIntervalId != null) clearInterval(refreshIntervalId);	
			generateSubscriptionActions();
		});
	}	

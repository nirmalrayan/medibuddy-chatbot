//Author: Nirmal Rayan
//Version: 1.0
//Application: MediBuddy (Microsoft Bot Framework)

// Add your requirements
var http = require('http');
var restify = require('restify');
var builder = require('botbuilder');
const {Wit, log} = require('node-wit');
require('env2')('.env'); // loads all entries into process.env

//const botauth = require("botauth");

//const passport = require("passport");
//const FacebookStrategy = require("passport-facebook").Strategy;

//encryption key for saved state
//const BOTAUTH_SECRET = "TESTBOT";  

// Setup Restify Server

var server = restify.createServer();
server.listen(process.env.PORT || process.env.port || 3978, function() 
{
   console.log('%s listening to %s', server.name, server.url); 
});
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

var inMemoryStorage = new builder.MemoryBotStorage(); 

// Create chat bot
var connector = new builder.ChatConnector
({  appId: process.env.MicrosoftAppId, 
	appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata   }); 
	
//MAIN.
var bot = new builder.UniversalBot(connector,

    function (session) {
        console.log("masterName" + session.message.address.channelId);
		if(session.message.address.channelId === 'facebook'){
 			var welcomeCard = new builder.HeroCard(session)
				.title("Hi "+session.message.address.user.name+"! Nice to see you. I am MediBuddy")
				.subtitle("I will be your personal healthcare assistant. ℹ️ Type \"show menu\" or \"#\" at any time to see the menu.")
				.images([
					new builder.CardImage(session)
						.url('https://i.imgur.com/HwRgHDI.png')
						.alt('MediBuddy')
				])
				.buttons([
					builder.CardAction.imBack(session, "Show Menu", "Show Menu")
				]); 
		}
		else{
            console.log("masterName" + session.userData.masterName);
			if(session.userData.masterName){
				var welcomeCard = new builder.HeroCard(session)
				.title("Hi " + session.userData.masterName + "! Nice to see you again")
				.subtitle("I will be your personal healthcare assistant. ℹ️ Type `\"show menu\"` or `\"#\"` at any time to see the menu.")
				.images([
					new builder.CardImage(session)
						.url('https://i.imgur.com/HwRgHDI.png')
						.alt('MediBuddy')
				])
				.buttons([
					builder.CardAction.imBack(session, "Show Menu", "Show Menu")
				]);
				
			}
			else{
				var welcomeCard = new builder.HeroCard(session)
				.title("Greetings! I'm MediBuddy")
				.subtitle("I will be your personal healthcare assistant. ℹ️ Type \"show menu\" or \"#\" at any time to see the menu.")
				.images([
					new builder.CardImage(session)
						.url('https://i.imgur.com/HwRgHDI.png')
						.alt('MediBuddy')
				])
				.buttons([
					builder.CardAction.imBack(session, "Show Menu", "Show Menu")
				]);
			
			}
		}	
			session.send(new builder.Message(session)
				.addAttachment(welcomeCard));
			session.beginDialog("/refer");
	}).set('storage', inMemoryStorage); // Register in-memory storage 

//Direct to index.html web page
 server.get('/', restify.plugins.serveStatic({
 directory: __dirname,
 default: '/index.html'	
})); 


server.post('/api/messages', connector.listen());

//LUIS Configuration
var recognizer = new builder.LuisRecognizer("https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/4e0df9eb-a11f-495d-8e90-b0579fde9b86?subscription-key=a821560ec0914368a81cbb4382a0f2a7&verbose=true&timezoneOffset=0&q=");
//bot.recognizer(recog);

bot.dialog('/refer', new builder.IntentDialog({ recognizers : [recognizer]})
    .matches("SayHello", "hello")
	.matches("GetName", "setName")
	.matches("CustomerCare", "askforCallCenter")
	.matches("HR", "askforHR")
	.matches("Grievance", "askforGrievance")
	.matches("GeneralQuery", "askforGeneralQuery")
//	.matches("Abuse","askforAbuse")
	.matches("NotTrained","idontknow")
 //  .matches("Logout", "logout")
    
    .onDefault((session, args) => {
        console.log('inside')
        session.endDialog("Sorry, I did not understand \`%s\`.  Try saying `show menu` or `#` to go back to the main menu and `help` if you need assistance.", session.message.text);
    })
    
);


bot.dialog("hello", (session, args) => {
		session.endDialog("Hello. You can type `\"show menu\"` or `\"#\"` at any time of the conversation to go back to the main menu.");
}).triggerAction({
    matches: 'SayHello'
});

bot.dialog("idontknow", (session, args) => {
		session.endDialog("I'm sorry. I'm not yet trained to respond to this query but I'm getting smarter everyday!");
}).triggerAction({
    matches: 'NotTrained'
});
/*
// Initialize with the strategies we want to use
var ba = new botauth.BotAuthenticator(server, bot, { baseUrl : "https://medibot.azurewebsites.net", secret : BOTAUTH_SECRET })
    .provider("facebook", (options) => { 
        return new FacebookStrategy({
            clientID : "237966616730835",
            clientSecret : "fbbb50fedbbf667de389668d9abb1a5b",
            callbackURL : options.callbackURL
        }, (accessToken, refreshToken, profile, done) => {
            profile = profile || {};
            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            
            return done(null, profile);
        });
	});

*/
/*
bot.dialog("profile", [].concat( 
    ba.authenticate("facebook"),
    function(session, results) {
        //get the facebook profile
		var user = ba.profile(session, "facebook");
		var restifyclnt = require('restify-clients');
		console.log('Facebook profile response: '+user);
        //var user = results.response;

        //call facebook and get something using user.accessToken 
        var client = restifyclnt.createJsonClient({
            url: 'https://graph.facebook.com',
            accept : 'application/json',
            headers : {
                "Authorization" : `OAuth ${ user.accessToken }`
            }
        });

        client.get(`/v2.8/me/picture?redirect=0`, (err, req, res, obj) => {
            if(!err) {
                console.log(obj);
                var msg = new builder.Message()
                    .attachments([
						new builder.HeroCard(session)
							.title('Facebook Authentication - Successful')
							.subtitle('Type `\"logout\"` at anytime to sign out of facebook.')
                            .text("You have logged in as "+user.displayName)
                            .images([
                                new builder.CardImage(session).url(obj.data.url)
                                ]
                            )
                        ]
					);
				session.userData.masterName = user.displayName;
				session.userData.fbLogin = "true";
                session.endDialog(msg);
            } else {
                console.log(err);
                session.endDialog("error getting profile");
            }
        });
    }
));

bot.dialog("logout", [
    (session, args, next) => {
        builder.Prompts.confirm(session, "are you sure you want to logout")      
    }, (session, args) => {
        if(args.response) {
            ba.logout(session, "facebook");
            session.endDialog("you've been logged out.");
        } else {
            session.endDialog("you're still logged in");
        }
    }
]); 

*/
	
// Dialog to ask for Master Name
bot.dialog('setName',[
	function (session, args, next){
			var nameEntity = builder.EntityRecognizer.findEntity(args.entities, 'SetName');
			if(nameEntity){
				session.userData.masterName = nameEntity.entity;
//				next({ response: nameEntity.entity });
				session.endConversation('Welcome, '+ session.userData.masterName+"!");
			}
			else{
				builder.Prompts.text(session, 'Please enter your name');
			}
	},
	function(session, results){
		session.userData.masterName = results.response;
		session.endConversation('Welcome, '+ session.userData.masterName+"!");
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]).triggerAction({
    matches: 'GetName'
});;

	
// Dialog to show main menu
bot.dialog('showMenu',[
	function (session){	
			var menucards = [];
			
			trackClaimCard = new builder.HeroCard(session)
									.title("Track Claim")
									.subtitle("Tracking your claim can help you understand where you are in the claims process.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/EgFg36v.png')
											.alt('Track Claim')
									])
									.buttons([
										builder.CardAction.imBack(session, "Track Claim", "Track Claim")
										]);
			
			menucards.push(trackClaimCard);
			
			downloadCard = new builder.HeroCard(session)
									.title("Download E-Card")
									.subtitle("Getting your Medi Assist E-Card is much simpler and at your finger tips. Download your E-Card now.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/80FLdwc.png')
											.alt('Download E-Card')
									])
									.buttons([
										builder.CardAction.imBack(session, "Download E-Card", "Download E-Card")
										]);
			
			menucards.push(downloadCard);
			
			searchNetworkCard = new builder.HeroCard(session)
									.title("Search Network")
									.subtitle("Search Medi Assist to find the nearest network hospitals and avail e-cashless benefits.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/5Rc0b6m.png')
											.alt('Search Network')
									])
									.buttons([
										builder.CardAction.imBack(session, "Search Network", "Search Network")
										]);
			
			menucards.push(searchNetworkCard);
			
			healthCheckCard = new builder.HeroCard(session)
									.title("Health Check")
									.subtitle("Booking health check has never been easier. Find the best hospitals with discounts in your city now.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/LGKrs5k.png')
											.alt('Health Check')
									])
									.buttons([
										builder.CardAction.imBack(session, "Health Check", "Health Check")
										]);
			
			menucards.push(healthCheckCard);
	
			medicineCard = new builder.HeroCard(session)
									.title("Medicine")
									.subtitle("We bring pharmacies to your doorsteps. Click below to know more about ordering medicines.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/zdqBW3P.png')
											.alt('Medicine')
									])
									.buttons([
										builder.CardAction.imBack(session, "Medicine", "Medicine")
										]);
			
			menucards.push(medicineCard);

			consultationCard = new builder.HeroCard(session)
									.title("Consultation")
									.subtitle("Do you want to book a consultation with a doctor of your choice? Click below to know more.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/kulyrgx.png')
											.alt('Medicine')
									])
									.buttons([
										builder.CardAction.imBack(session, "Consultation", "Consultation")
										]);
			
			menucards.push(consultationCard);

			homecareCard = new builder.HeroCard(session)
									.title("Home Health Care")
									.subtitle("MediBuddy Infiniti brings `Physiotherapist`, `Attendant` and `Nursing` visit facilities to your home.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/FbM1SvH.png')
											.alt('Medicine')
									])
									.buttons([
										builder.CardAction.imBack(session, "Home Health Care", "Home Health Care")
										]);
			
			menucards.push(homecareCard);

			teleconsultationCard = new builder.HeroCard(session)
									.title("Tele Consultation")
									.subtitle("Book a telephonic consultation with our medical professionals at the lowest cost. Click below to learn more.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/Ps8hw1x.png')
											.alt('Tele Consultation')
									])
									.buttons([
										builder.CardAction.imBack(session, "Tele Consultation", "Tele Consultation")
										]);
			
			menucards.push(teleconsultationCard);

			labtestCard = new builder.HeroCard(session)
									.title("Lab Test")
									.subtitle("Looking for a clinical laboratory for diagnostics? We have you covered.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/BL44d2H.png')
											.alt('Lab Test')
									])
									.buttons([
										builder.CardAction.imBack(session, "Lab Test", "Lab Test")
										]);
			
			menucards.push(labtestCard);

			secondOpinionCard = new builder.HeroCard(session)
									.title("Second Opinion")
									.subtitle("An expert opinion allows you to access the expertise and clinical guidance of our world class physicians remotely from your home.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/RNwn1DK.png')
											.alt('Second Opinion')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/gso/259fb4d2abcb480fb4e8778a33b9c9d2", "Get Second Opinion")
										]);
			
			menucards.push(secondOpinionCard);

			genomeStudyCard = new builder.HeroCard(session)
									.title("Genome Study")
									.subtitle("Genome study involves DNA analysis to help predict, prevent and cure diseases. Find the method that's right for your research.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/0LaERtC.png')
											.alt('Genome Study')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/genome/1b1fbfb833ea4e8d96c0a0325da21d69", "Book Genome Study Package")
										]);
			
			menucards.push(genomeStudyCard);

			helpCard = new builder.HeroCard(session)
									.title("Information Center")
									.subtitle("I can help you plan your hospitalization, book eCashless or help you understand how claims work. Click below to know more.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/mtyutuq.png')
											.alt('Help')
									])
									.buttons([
										builder.CardAction.imBack(session, "Help", "Help")
										]);
			
			menucards.push(helpCard);

			var msg = new builder.Message(session)
			.text("My abilities are still growing. In a nutshell, here's what I can do: ")
			.attachmentLayout(builder.AttachmentLayout.carousel)
			.attachments(menucards);
		session.send(msg);
	},
	function(session, results) {
		session.endDialogWithResult(results);	
	}
])
.triggerAction({
	matches: [/^show menu$/i, /#/i]
});

// Dialog to start tracking claims
bot.dialog('trackClaim', [
	function (session){
		session.send("Wecome to Claim Tracking System ✨💫🌟");
		session.beginDialog('askforTrackBy');
	},
	function(session, results) {
		session.endDialogWithResult(results);	
	}
])
.triggerAction({
	matches: [/track claim/i, /track/i, /tracking/i, /claim tracking/i, /claim status/i, /pending claim/i, /claim details/i], 
	confirmPrompt: "⚠️ This will cancel your current request. Are you sure? (yes/no)"
	
});

// Dialog for displaying menu after completing requested tasks
bot.dialog('askforMore',[
	function (session){
		
		session.send("How else can I help you?");
		session.sendTyping();
		setTimeout(function () {
			session.beginDialog('showMenu');
		}, 5000);		
		/*
		builder.Prompts.choice(session, "How else can I help you?", mainMenu, builder.ListStyle.button);		
	},
	function (session, results) {
		if(results.response.entity == 'Track Claim'){
			session.beginDialog('trackClaim');
		}
		else if(results.response.entity == 'Download E-Card'){
			session.beginDialog('downloadEcard');
		}
		else if(results.response.entity == 'Search Network Hospitals'){
			session.beginDialog('searchNetwork');
		}
	},
	function(session, results) {
		session.endDialogWithResult(results);	*/
	}
]);

// Dialog to ask for Track By
bot.dialog('askforTrackBy',[
	function (session){
		var msg = new builder.Message(session)
			.text("Alright, let's get started 🚀. There are three ways to track your claim. Please select one of the following options: ")
			.suggestedActions(
				builder.SuggestedActions.create(
					session, [
						builder.CardAction.imBack(session, "Track with Claim ID", "Track with Claim ID"),
						builder.CardAction.imBack(session, "Track with Medi Assist ID", "Track with Medi Assist ID"),
						builder.CardAction.imBack(session, "Track with Employee ID", "Track with Employee ID"),
					])
			);
		session.send(msg);	
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

//Custom redirect to Track with Claim ID
bot.customAction({
	matches: /^Track with Claim ID$/gi,
	onSelectAction: (session, args, next) => {
		session.beginDialog('trackClaimwID');
		
	}
});

//Custom redirect to Track with Medi Assist ID
bot.customAction({
	matches: /^Track with Medi Assist ID$/gi,
	onSelectAction: (session, args, next) => {
		session.beginDialog('trackClaimwMAID');
		
	}
});

//Custom redirect to Track with Employee ID
bot.customAction({
	matches: /^Track with Employee ID$/gi,
	onSelectAction: (session, args, next) => {
		session.beginDialog('trackClaimwEmpID');
		
	}
});

// Dialog to ask for Confirmation - Track with Claim Number
bot.dialog('askforTrackClaimwIDConfirmation',[
	function (session){
		builder.Prompts.confirm(session, "💡 Let's try again? (yes/no)")
	},
	function (session, results) {
		if (results.response){
			session.replaceDialog('trackClaimwID', {reprompt: true});
		}
		else {
			session.endConversation();
			session.beginDialog('askforMore');
		}
		
	}
]);

// Dialog to Track with Claim Number
bot.dialog('trackClaimwID', [
				function (session){
					if(!session.dialogData.claimNumber){
//						console.log(session.message.address.channelId);
						session.beginDialog('askforClaimNumber');
					}
				},	
				function (session, results) {
					var clmNoChecker = /^\d{8}$/.test(results.response);
					if(JSON.stringify(clmNoChecker) == "true"){
						session.dialogData.claimNumber = results.response;
						session.beginDialog('askforDOA');
					}
					else{
						session.send("⚠️ The claim number should only be `numeric` and `eight digits` long.");
						session.beginDialog('askforTrackClaimwIDConfirmation');
					}
				},
				function (session, results) {
					session.dialogData.hospitalizationDate = builder.EntityRecognizer.resolveTime([results.response]);

					// Process request and display reservation details
					session.send("Tracking claim with details 🕵️ <br/>Claim Number: %s<br/>Date/Time: %s. <br/><br/>Please wait ⏳",
						session.dialogData.claimNumber, session.dialogData.hospitalizationDate);
					
					//Make POST request to MA Server
					var request = require('request');	
					
					// Set the headers
					var headers = {
						'User-Agent':       'Super Agent/0.0.1',
						'Content-Type':     'application/x-www-form-urlencoded'
					}

					// Configure the request
					var options = {
						url: 'https://track.medibuddy.in/api/TrackClaimWithClaimNumber/.json',
						method: 'POST',
						headers: headers,
						form: {'claimNumber':session.dialogData.claimNumber,'date':session.dialogData.hospitalizationDate}
					}

					// Start the request
					response = request(options, function (error, response, body) {
						if (!error && response.statusCode == 200) {	
							data = JSON.parse(body);
							
							if(JSON.stringify(data.isSuccess) === "true"){

								var claimdata = data.claimDetails;
							
								session.userData.trackIsSuccess = JSON.stringify(data.isSuccess);
								session.userData.trackIsRetailPolicy = JSON.stringify(data.isRetailPolicy);
								
								//Claim Details
								session.userData.trackClaimId = JSON.stringify(claimdata[0].claimDetails.claimId);
								session.userData.trackClaimType = claimdata[0].claimDetails.claimType;
								session.userData.trackClaimReceivedDate = claimdata[0].claimDetails.claimReceivedDate;
								session.userData.trackClmAmount = JSON.stringify(claimdata[0].claimDetails.clmAmount);
								session.userData.trackClmApprovedAmt = JSON.stringify(claimdata[0].claimDetails.clmApprovedAmt);
								session.userData.trackclmPreAuthAmt = JSON.stringify(claimdata[0].claimDetails.clmPreAuthAmt);
								session.userData.trackClaimStatus = claimdata[0].claimDetails.claimStatus;
								session.userData.trackDoa = claimdata[0].claimDetails.doa;
								session.userData.trackDod = claimdata[0].claimDetails.dod;
								session.userData.trackClaimApprovedDate = claimdata[0].claimDetails.claimApprovedDate;
								if(claimdata[0].claimDetails.claimDeniedDate === "01-Jan-0001" ){
									session.userData.trackClaimDeniedDate = "-";
								}else{
									session.userData.trackClaimDeniedDate = claimdata[0].claimDetails.claimDeniedDate;
								}
								session.userData.trackHospitalName = claimdata[0].claimDetails.hospitalName;
								session.userData.trackIsClmNMI = JSON.stringify(claimdata[0].claimDetails.isClmNMI);
								session.userData.trackIsClmDenied = JSON.stringify(claimdata[0].claimDetails.isClmDenied);
								session.userData.trackDenialReasons = claimdata[0].claimDetails.denialReasons;
								
								//Policy Details
								session.userData.trackPolicyNo = claimdata[0].beneficiaryDetails.policyNo;
								session.userData.trackBenefMAID = JSON.stringify(claimdata[0].beneficiaryDetails.benefMAId);
								session.userData.trackBenefName = claimdata[0].beneficiaryDetails.benefName;
								session.userData.trackBenefRelation = claimdata[0].beneficiaryDetails.benefRelation;
								
								//Discharge Summary
								session.userData.trackNonPayableAmount = JSON.stringify(claimdata[0].dischargeSummary.nonPayableAmount);
								session.userData.trackNonPayReason =claimdata[0].dischargeSummary.nonPayReason;
								session.userData.trackAmountPaidByPatient = JSON.stringify(claimdata[0].dischargeSummary.amountPaidByPatient);
								session.userData.trackAmountPaidByCorporate = JSON.stringify(claimdata[0].dischargeSummary.amountPaidByCorporate);
								session.userData.trackPolicyExcessAmount = JSON.stringify(claimdata[0].dischargeSummary.policyExcessAmount);
								session.userData.trackHospitalDiscount = JSON.stringify(claimdata[0].dischargeSummary.hospitalDiscount);
								session.userData.trackAdvancePaidByPatient = JSON.stringify(claimdata[0].dischargeSummary.advancePaidByPatient);
								session.userData.trackDeductionReason = claimdata[0].dischargeSummary.deductionReason;
								
								
								var card = createReceiptCard(session);
								var msg = new builder.Message(session).addAttachment(card);
								session.send(msg);
								session.sendTyping();
								setTimeout(function () {
									session.endConversation();
									session.beginDialog('askforMore');
								}, 5000);		
  							}
							else if(JSON.stringify(data.isSuccess) === "false"){
								if(data.errorMessage == "Please enter valid claim ID."){
									session.send('⚠️ The claim ID you have entered is incorrect.');
									session.beginDialog('askforTrackClaimwIDConfirmation');
								}
								else if (data.errorMessage == "Please enter valid date between hospitalization and discharge."){
									session.send('⚠️ The date you have entered is incorrect.');
									session.beginDialog('askforTrackClaimwIDConfirmation');
								}
							}  
						}
					});
					
					session.endDialog();
				}
]);

// Dialog to ask for Confirmation - Track with MAID
bot.dialog('askforTrackClaimwMAIDConfirmation',[
	function (session){
		builder.Prompts.confirm(session, "💡 Let's try again? (yes/no)")
	},
	function (session, results) {
		if (results.response){
			session.replaceDialog('trackClaimwMAID', {reprompt: true});
		}
		else {
			session.endConversation();
			session.beginDialog('askforMore');
		}
		
	}
]);

// Dialog to Track with Medi Assist ID
bot.dialog('trackClaimwMAID', [
				function (session){
						session.beginDialog('askforMAID');
					
				},	
				function (session, results) {
					session.dialogData.MAID = results.response;
					
					var clmMAIDChecker = /^\d{10}$/.test(results.response);
					if(JSON.stringify(clmMAIDChecker) == "true"){
						session.dialogData.MAID = results.response;
						session.beginDialog('askforDOA');
					}
					else{
						session.send("⚠️ The Medi Assist ID should only be `numeric` and `ten digits` long.");
						session.beginDialog('askforTrackClaimwMAIDConfirmation');
					}
				},
				function (session, results) {
					session.dialogData.hospitalizationDate = builder.EntityRecognizer.resolveTime([results.response]);

					// Process request and display reservation details
					session.send("Tracking claim with details 🕵️ <br/>Medi Assist ID: %s<br/>Date/Time: %s. <br/><br/>Please wait ⏳",
						session.dialogData.MAID, session.dialogData.hospitalizationDate);
					
					//Make POST request to MA Server
					var request = require('request');
					
					// Set the headers
					var headers = {
						'User-Agent':       'Super Agent/0.0.1',
						'Content-Type':     'application/x-www-form-urlencoded'
					}

					// Configure the request
					var options = {
						url: 'https://track.medibuddy.in/api/TrackClaimWithMAID/.json',
						method: 'POST',
						headers: headers,
						form: {'maid':session.dialogData.MAID,'date':session.dialogData.hospitalizationDate}
					}

					// Start the request
					response = request(options, function (error, response, body) {
						if (!error && response.statusCode == 200) {	
							// Print out the response body
							data = JSON.parse(body);
							console.log(data);
							
							if(JSON.stringify(data.isSuccess) === "true"){
						    	console.log(JSON.stringify(data.isSuccess));

								var claimdata = data.claimDetails;
							
								session.userData.trackIsSuccess = JSON.stringify(data.isSuccess);
								session.userData.trackIsRetailPolicy = JSON.stringify(data.isRetailPolicy);
								
								//Claim Details
								session.userData.trackClaimId = JSON.stringify(claimdata[0].claimDetails.claimId);
								session.userData.trackClaimType = claimdata[0].claimDetails.claimType;
								session.userData.trackClaimReceivedDate = claimdata[0].claimDetails.claimReceivedDate;
								session.userData.trackClmAmount = JSON.stringify(claimdata[0].claimDetails.clmAmount);
								session.userData.trackClmApprovedAmt = JSON.stringify(claimdata[0].claimDetails.clmApprovedAmt);
								session.userData.trackclmPreAuthAmt = JSON.stringify(claimdata[0].claimDetails.clmPreAuthAmt);
								session.userData.trackClaimStatus = claimdata[0].claimDetails.claimStatus;
								session.userData.trackDoa = claimdata[0].claimDetails.doa;
								session.userData.trackDod = claimdata[0].claimDetails.dod;
								session.userData.trackClaimApprovedDate = claimdata[0].claimDetails.claimApprovedDate;
								if(claimdata[0].claimDetails.claimDeniedDate === "01-Jan-0001" ){
									session.userData.trackClaimDeniedDate = "-";
								}else{
									session.userData.trackClaimDeniedDate = claimdata[0].claimDetails.claimDeniedDate;
								}
								session.userData.trackHospitalName = claimdata[0].claimDetails.hospitalName;
								session.userData.trackIsClmNMI = JSON.stringify(claimdata[0].claimDetails.isClmNMI);
								session.userData.trackIsClmDenied = JSON.stringify(claimdata[0].claimDetails.isClmDenied);
								session.userData.trackDenialReasons = claimdata[0].claimDetails.denialReasons;
								
								//Policy Details
								session.userData.trackPolicyNo = claimdata[0].beneficiaryDetails.policyNo;
								session.userData.trackBenefMAID = JSON.stringify(claimdata[0].beneficiaryDetails.benefMAId);
								session.userData.trackBenefName = claimdata[0].beneficiaryDetails.benefName;
								session.userData.trackBenefRelation = claimdata[0].beneficiaryDetails.benefRelation;
								
								//Discharge Summary
								session.userData.trackNonPayableAmount = JSON.stringify(claimdata[0].dischargeSummary.nonPayableAmount);
								session.userData.trackNonPayReason =claimdata[0].dischargeSummary.nonPayReason;
								session.userData.trackAmountPaidByPatient = JSON.stringify(claimdata[0].dischargeSummary.amountPaidByPatient);
								session.userData.trackAmountPaidByCorporate = JSON.stringify(claimdata[0].dischargeSummary.amountPaidByCorporate);
								session.userData.trackPolicyExcessAmount = JSON.stringify(claimdata[0].dischargeSummary.policyExcessAmount);
								session.userData.trackHospitalDiscount = JSON.stringify(claimdata[0].dischargeSummary.hospitalDiscount);
								session.userData.trackAdvancePaidByPatient = JSON.stringify(claimdata[0].dischargeSummary.advancePaidByPatient);
								session.userData.trackDeductionReason = claimdata[0].dischargeSummary.deductionReason;
								
								
								var card = createReceiptCard(session);
								var msg = new builder.Message(session).addAttachment(card);
								session.send("Here are your latest claim details:");
								session.send(msg);
								session.sendTyping();
								setTimeout(function () {
									session.endConversation();		
									session.beginDialog('askforMore');
								}, 5000);		
  							}
							else if(JSON.stringify(data.isSuccess) === "false"){
								console.log("Error message is "+ data.errorMessage);
								if(data.errorMessage == "Please enter valid Medi Assist ID."){
									session.send('⚠️ The Medi Assist ID you have entered is incorrect.');
									session.beginDialog('askforTrackClaimwMAIDConfirmation');
								}
								else if (data.errorMessage == "Please enter valid date between hospitalization and discharge."){
									session.send('⚠️ The date you have entered is incorrect.');
									session.beginDialog('askforTrackClaimwMAIDConfirmation');
								}
							}  
						}
					});
					
					session.endDialog();
				}
]);

// Dialog to ask for Confirmation - Track with Employee Details
bot.dialog('askforTrackClaimwEmpIDConfirmation',[
	function (session){
		builder.Prompts.confirm(session, "💡 Let's try again? (yes/no)")
	},
	function (session, results) {
		if (results.response){
			session.replaceDialog('trackClaimwEmpID', {reprompt: true});
		}
		else {
			session.endConversation();
			session.beginDialog('askforMore');
		}
		
	}
]);

// Dialog to Track with Employee Details
bot.dialog('trackClaimwEmpID', [
				function (session){
						session.beginDialog('askforEmpID');
				},	
				function (session, results){
					session.dialogData.EmpID = results.response;
					session.beginDialog('askforCorporate');
				},	
				function (session, results) {
					session.dialogData.Corporate = results.response;
					session.beginDialog('askforDOA');
				},
				function (session, results) {
					session.dialogData.hospitalizationDate = builder.EntityRecognizer.resolveTime([results.response]);

					// Process request and display reservation details
					session.send("Tracking claim with details 🕵️ <br/>Employee ID: %s<br/>Corporate: %s<br/>Date/Time: %s. <br/><br/>Please wait ⏳",
						session.dialogData.EmpID, session.dialogData.Corporate, session.dialogData.hospitalizationDate);
					
					//Make POST request to MA Server
					var request = require('request');
					
					// Set the headers
					var headers = {
						'User-Agent':       'Super Agent/0.0.1',
						'Content-Type':     'application/x-www-form-urlencoded'
					}

					// Configure the request
					var options = {
						url: 'https://track.medibuddy.in/api/TrackClaimWithEmpDetails/.json',
						method: 'POST',
						headers: headers,
						form: {'employeeId':session.dialogData.EmpID, 'corporateName': session.dialogData.Corporate, 'date':session.dialogData.hospitalizationDate}
					}

					// Start the request
					response = request(options, function (error, response, body) {
						if (!error && response.statusCode == 200) {	
							// Print out the response body
							data = JSON.parse(body);
							console.log(data);
							
							if(JSON.stringify(data.isSuccess) === "true"){

								var claimdata = data.claimDetails;
							
								session.userData.trackIsSuccess = JSON.stringify(data.isSuccess);
								session.userData.trackIsRetailPolicy = JSON.stringify(data.isRetailPolicy);
								
								//Claim Details
								session.userData.trackClaimId = JSON.stringify(claimdata[0].claimDetails.claimId);
								session.userData.trackClaimType = claimdata[0].claimDetails.claimType;
								session.userData.trackClaimReceivedDate = claimdata[0].claimDetails.claimReceivedDate;
								session.userData.trackClmAmount = JSON.stringify(claimdata[0].claimDetails.clmAmount);
								session.userData.trackClmApprovedAmt = JSON.stringify(claimdata[0].claimDetails.clmApprovedAmt);
								session.userData.trackclmPreAuthAmt = JSON.stringify(claimdata[0].claimDetails.clmPreAuthAmt);
								session.userData.trackClaimStatus = claimdata[0].claimDetails.claimStatus;
								session.userData.trackDoa = claimdata[0].claimDetails.doa;
								session.userData.trackDod = claimdata[0].claimDetails.dod;
								session.userData.trackClaimApprovedDate = claimdata[0].claimDetails.claimApprovedDate;
								if(claimdata[0].claimDetails.claimDeniedDate === "01-Jan-0001" ){
									session.userData.trackClaimDeniedDate = "-";
								}else{
									session.userData.trackClaimDeniedDate = claimdata[0].claimDetails.claimDeniedDate;
								}
								session.userData.trackHospitalName = claimdata[0].claimDetails.hospitalName;
								session.userData.trackIsClmNMI = JSON.stringify(claimdata[0].claimDetails.isClmNMI);
								session.userData.trackIsClmDenied = JSON.stringify(claimdata[0].claimDetails.isClmDenied);
								session.userData.trackDenialReasons = claimdata[0].claimDetails.denialReasons;
								
								//Policy Details
								session.userData.trackPolicyNo = claimdata[0].beneficiaryDetails.policyNo;
								session.userData.trackBenefMAID = JSON.stringify(claimdata[0].beneficiaryDetails.benefMAId);
								session.userData.trackBenefName = claimdata[0].beneficiaryDetails.benefName;
								session.userData.trackBenefRelation = claimdata[0].beneficiaryDetails.benefRelation;
								
								//Discharge Summary
								session.userData.trackNonPayableAmount = JSON.stringify(claimdata[0].dischargeSummary.nonPayableAmount);
								session.userData.trackNonPayReason =claimdata[0].dischargeSummary.nonPayReason;
								session.userData.trackAmountPaidByPatient = JSON.stringify(claimdata[0].dischargeSummary.amountPaidByPatient);
								session.userData.trackAmountPaidByCorporate = JSON.stringify(claimdata[0].dischargeSummary.amountPaidByCorporate);
								session.userData.trackPolicyExcessAmount = JSON.stringify(claimdata[0].dischargeSummary.policyExcessAmount);
								session.userData.trackHospitalDiscount = JSON.stringify(claimdata[0].dischargeSummary.hospitalDiscount);
								session.userData.trackAdvancePaidByPatient = JSON.stringify(claimdata[0].dischargeSummary.advancePaidByPatient);
								session.userData.trackDeductionReason = claimdata[0].dischargeSummary.deductionReason;
								
								
								var card = createReceiptCard(session);
								var msg = new builder.Message(session).addAttachment(card);
								session.send("Here are your latest claim details:");
								session.send(msg);
								session.sendTyping();
								setTimeout(function () {
									session.endConversation();
									session.beginDialog('askforMore');
								}, 5000);		
  							}
							else if(JSON.stringify(data.isSuccess) === "false"){
								if(data.errorMessage == "Please enter valid employee details."){
									session.send('⚠️ The employee details you have entered is incorrect.');
									session.beginDialog('askforTrackClaimwEmpIDConfirmation');
								}
								else if (data.errorMessage == "Please enter valid date between hospitalization and discharge."){
									session.send('⚠️ The date you have entered is incorrect.');
									session.beginDialog('askforTrackClaimwEmpIDConfirmation');
								}
							}  
						}
					});
					
					session.endDialog();
				}
]);

// Format Number in Indian Format
function formatNumber(num){
	var x=num;
	x=x.toString();
	var lastThree = x.substring(x.length-3);
	var otherNumbers = x.substring(0,x.length-3);
	if(otherNumbers != '')
		lastThree = ',' + lastThree;
	var res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

	return(res);

}

// Receipt Card - Track Claim Result
function createReceiptCard(session) {
	if (session.message.address.channelId === 'facebook'){
		return session.send('📝 Beneficiary: '+ session.userData.trackBenefName+' | Medi Assist ID: '+ session.userData.trackBenefMAID+' | Hospital: '+ session.userData.trackHospitalName+ ' | Claim Number: '+ session.userData.trackClaimId+' | '
		+ ' | Claim Type: '+ session.userData.trackClaimType + ' | Date of Hospitalization: '+ session.userData.trackDoa+ ' | Date of Discharge: ' + session.userData.trackDod 
		+ ' | Relation to Beneficiary: ' + session.userData.trackBenefRelation+ ' | Claim Received Date: ' + session.userData.trackClaimReceivedDate + ' | Claim Approved Date: '+ 
		session.userData.trackClaimApprovedDate + ' | Claim Denied Date: ' + session.userData.trackClaimDeniedDate+ ' | Policy Number: ' + session.userData.trackPolicyNo + 
		' | Claimed Amount: Rs. '+ formatNumber(session.userData.trackClmAmount) + ' | Hospital Discount : Rs. '+ formatNumber(session.userData.trackHospitalDiscount) + 
		' | Amount Paid by Beneficiary: Rs. '+ formatNumber(session.userData.trackAmountPaidByPatient) + ' | Amount Paid by Corporate : Rs. '+ formatNumber(session.userData.trackAmountPaidByCorporate) + 
		' | Non Payable Amount : Rs. ' + formatNumber(session.userData.trackNonPayableAmount) + ' | Policy Excess Amount : Rs. '+ formatNumber(session.userData.trackPolicyExcessAmount) +
		' | Advance Paid by Beneficiary : Rs. '+formatNumber(session.userData.trackAdvancePaidByPatient)+ ' | Approved Amount : Rs. '+ formatNumber(session.userData.trackClmApprovedAmt)
		);
	}
	else{
    return new builder.HeroCard(session)
        .title(session.userData.trackBenefName + ' (' + session.userData.trackBenefMAID + ')')
        .subtitle('### Hospital : ' + session.userData.trackHospitalName + '\r\r ### Status : ' + session.userData.trackClaimStatus)
        .text('#### Claim Number : ' + session.userData.trackClaimId + '\r\r' +
			'#### Claim Type : ' + session.userData.trackClaimType + '\r\r' +
			'#### Date of Hospitalization : ' + session.userData.trackDoa + '\r\r' +
			'#### Date of Discharge: ' + session.userData.trackDod + '\r\r' +
			'#### Relation to Beneficiary : ' + session.userData.trackBenefRelation + '\r\r' +
			'#### Claim Received Date : ' + session.userData.trackClaimReceivedDate + '\r\r' +
			'#### Claim Approved Date : ' + session.userData.trackClaimApprovedDate + '\r\r' +
			'#### Claim Denied Date : ' + session.userData.trackClaimDeniedDate + '\r\r' +
			'#### Policy Number : ' + session.userData.trackPolicyNo + '\r\r' +
			'#### Claimed Amount : &#x20B9; ' + formatNumber(session.userData.trackClmAmount) + '/- \r\r' +
			'#### Hospital Discount : &#x20B9; ' + formatNumber(session.userData.trackHospitalDiscount) + '/- \r\r' +
			'#### Amount Paid by Beneficiary : &#x20B9; ' + formatNumber(session.userData.trackAmountPaidByPatient) + '/- \r\r' +
			'#### Amount Paid by Corporate : &#x20B9; ' + formatNumber(session.userData.trackAmountPaidByCorporate) + '/- \r\r' +
			'#### Non Payable Amount : &#x20B9; ' + formatNumber(session.userData.trackNonPayableAmount) + '/- \r\r' +
			'#### Policy Excess Amount : &#x20B9; ' + formatNumber(session.userData.trackPolicyExcessAmount) + '/- \r\r' +
			'#### Advance Paid by Beneficiary : &#x20B9; ' + formatNumber(session.userData.trackAdvancePaidByPatient) + '/- \r\r' +
			'#### Approved Amount : &#x20B9; ' + formatNumber(session.userData.trackClmApprovedAmt) + '/- \r\r' 
		)
        .images([
            builder.CardImage.create(session, 'https://i.imgur.com/j6md6yB.png')
        ])
        .buttons([
            builder.CardAction.openUrl(session, 'https://track.medibuddy.in/', 'More Information')
        ]);
	
	}	
	
	
/*     return new builder.ReceiptCard(session)
        .title(session.userData.trackBenefName + ' (' + session.userData.trackBenefMAID + ')')
        .facts([
            builder.Fact.create(session, session.userData.trackClaimId, 'Claim Number'),
            builder.Fact.create(session, session.userData.trackClaimType, 'Claim Type'),
			builder.Fact.create(session, session.userData.trackHospitalName, 'Hospital Name'),
			builder.Fact.create(session, session.userData.trackDoa, 'Date of Hospitalization'),
			builder.Fact.create(session, session.userData.trackDoa, 'Date of Discharge'),
			builder.Fact.create(session, session.userData.trackClaimStatus, 'Claim Status'),
			builder.Fact.create(session, session.userData.trackBenefRelation, 'Relation'),
			builder.Fact.create(session, session.userData.trackClaimReceivedDate, 'Claim Received Date'),
			builder.Fact.create(session, session.userData.trackClaimApprovedDate, 'Claim Approved Date'),
			builder.Fact.create(session, session.userData.trackClaimDeniedDate, 'Claim Denied Date'),
			builder.Fact.create(session, session.userData.trackPolicyNo, 'Policy Number')
			
			
        ])
        .items([
            builder.ReceiptItem.create(session, 'Rs. '+ session.userData.trackClmAmount, 'Claimed Amount'),
            builder.ReceiptItem.create(session, 'Rs. ' + session.userData.trackHospitalDiscount, 'Hospital Discount'),
            builder.ReceiptItem.create(session, 'Rs. '+ session.userData.trackAmountPaidByPatient, 'Amount Paid by Beneficiary'),
            builder.ReceiptItem.create(session, 'Rs. '+ session.userData.trackAmountPaidByCorporate, 'Amount Paid by Corporate'),
            builder.ReceiptItem.create(session, 'Rs. '+ session.userData.trackNonPayableAmount, 'Non Payable Amount'),
            builder.ReceiptItem.create(session, 'Rs. '+ session.userData.trackPolicyExcessAmount, 'Policy Excess Amount'),
            builder.ReceiptItem.create(session, 'Rs. '+ session.userData.trackAdvancePaidByPatient, 'Advance Paid by Beneficiary')
        ])
        .total('Rs. ' + session.userData.trackClmApprovedAmt)
        .buttons([
            builder.CardAction.openUrl(session, 'https://track.medibuddy.in/', 'More Information')
                .image('https://raw.githubusercontent.com/amido/azure-vector-icons/master/renders/microsoft-azure.png')
        ]); */
}

// Dialog to ask for Claim Number
bot.dialog('askforClaimNumber',[
	function (session){
		builder.Prompts.text(session, "Please provide your claim number");		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

//Dialog to ask for DOA
bot.dialog('askforDOA',[
	function (session){
		builder.Prompts.time(session, "Please provide any date between hospitalization and discharge");		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.beginDialogAction('doaHelpAction', 'doaHelp', { matches: /^help$/i });

// Dialog to ask for Medi Assist ID
bot.dialog('askforMAID',[
	function (session){
		builder.Prompts.text(session, "Please provide your Medi Assist ID");		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

// Dialog to ask for Employee ID
bot.dialog('askforEmpID',[
	function (session){
		builder.Prompts.text(session, "Please provide your Employee ID");		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

// Dialog to ask for Corporate Name
bot.dialog('askforCorporate',[
	function (session){
		builder.Prompts.text(session, "Please provide your Corporate Name");		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

// Dialog to ask for Policy Number
bot.dialog('askforPolNo',[
	function (session){
		builder.Prompts.text(session, "Please provide your Policy Number");		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

// Context Help dialog for Hospitalization date 
bot.dialog('doaHelp', function(session, args, next) {
    var msg = "⛑️ You can enter the date in any format. Eg. if date of admission is 01-Jan-2017 and discharge is 05-Jan-2017, you can enter any date from 1st Jan,2017 to 5th Jan, 2017";
    session.endDialog(msg);
});

// Generic Help dialog for Bot
bot.dialog('help', [
	function(session){
			session.send("⛑️ MediBuddy can help you track your claim, download e-card or search nearby hospitals within Medi Assist Network.");
			builder.Prompts.confirm(session,"Do you need help understanding how claims work? (yes/no)")
	},
	function(session, results){
		if(results.response){
		var cards = [];
			howClaimsWorkCard = new builder.VideoCard(session)
									.title('How Claims Work')
									.subtitle('by Medi Assist')
									.text('Understanding how claims work will help you in making the right decisions at the right time. Watch this video to know more.')
									.media([
										{ url: 'https://redirector.googlevideo.com/videoplayback?id=o-AKfiO18rQ6PJsKTH-jf_NfQDuZmwQ4OHuwvVzZYspG3F&expire=1505492761&mm=31&mn=sn-ab5szn76&mime=video%2Fmp4&dur=154.087&itag=22&pl=53&ip=2001%3A19f0%3A5%3A1de%3A5400%3Aff%3Afe4f%3A2207&key=yt6&ei=uKq7Wc_tNa6p8gSO14OgAg&ms=au&source=youtube&mv=m&sparams=dur%2Cei%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cpl%2Cratebypass%2Crequiressl%2Csource%2Cexpire&ipbits=0&requiressl=yes&mt=1505471077&initcwndbps=4132500&signature=AA85CFD9E8A0FAADF849874D9944ADA71FABA9BB.12209AD809EADCA51E78087AC08A0BFB582EBFB7&lmt=1471497193909465&ratebypass=yes' }
									])
									.buttons([
										builder.CardAction.openUrl(session, 'https://www.mediassistindia.com/', 'Visit Medi Assist')
									]);
			cards.push(howClaimsWorkCard);

			secondOpinionCard = new builder.HeroCard(session)
									.title("Second Opinion")
									.subtitle("An expert opinion allows you to access the expertise and clinical guidance of our world class physicians remotely from your home.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/RNwn1DK.png')
											.alt('Second Opinion')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/gso/259fb4d2abcb480fb4e8778a33b9c9d2", "Get Second Opinion")
										]);
			
			cards.push(secondOpinionCard);

			howEcashlessWorksCard = new builder.VideoCard(session)
									.title('Plan Cashless Hospitalization')
									.subtitle('by Medi Assist')
									.text('And watch this video on how you can plan a cashless hospitalization from the comfort of your home.')
									.media([
										{ url: 'https://redirector.googlevideo.com/videoplayback?source=youtube&pl=33&dur=88.398&id=o-ADxxPDaZrTgbXKFAtpBMkclSponVczPxe0AMU09GNEiy&ei=B7K7WZXFIqOr-AO5srjYCA&itag=22&lmt=1471712672818513&requiressl=yes&key=yt6&ip=2600%3A3c01%3A%3Af03c%3A91ff%3Afe24%3Ab564&mime=video%2Fmp4&signature=4CCB3ED2DD50978E634254250014E9FC82A71FEB.53362160533AF3707B90C4A0E2CFCCB374C7E72C&expire=1505494631&mt=1505472944&mv=m&initcwndbps=4832500&ipbits=0&ratebypass=yes&ms=au&mm=31&mn=sn-n4v7sn7z&sparams=dur%2Cei%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cpl%2Cratebypass%2Crequiressl%2Csource%2Cexpire' }
									])
									.buttons([
										builder.CardAction.openUrl(session, 'https://www.mediassistindia.com/', 'Visit Medi Assist')
									]);
			cards.push(howEcashlessWorksCard)
			const msg = new builder.Message(session);
			msg.attachmentLayout(builder.AttachmentLayout.carousel)
			.text("Let's try and ease just some of anxiety by helping you plan the hospitalization.")
				.attachments(cards);
			session.send(msg);
		}

		builder.Prompts.confirm(session, "Would you like me to help you plan a cashless hospitalization? (yes/no)");
	},
	function(session, results){
		if(results.response){
			var cards = [];
			searchNetworkCard = new builder.HeroCard(session)
						.title("Search Network")
						.subtitle("Search Medi Assist to find the nearest network hospitals and avail e-cashless benefits.")
						.images([
							new builder.CardImage(session)
								.url('https://i.imgur.com/5Rc0b6m.png')
								.alt('Search Network')
						])
						.buttons([
							builder.CardAction.imBack(session, "Search Network", "Search Network")
							]);
			cards.push(searchNetworkCard);

			secondOpinionCard = new builder.HeroCard(session)
									.title("Second Opinion")
									.subtitle("An expert opinion allows you to access the expertise and clinical guidance of our world class physicians remotely from your home.")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/RNwn1DK.png')
											.alt('Second Opinion')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/gso/259fb4d2abcb480fb4e8778a33b9c9d2", "Get Second Opinion")
										]);
			
			cards.push(secondOpinionCard);

			bookECashlessCard = new builder.HeroCard(session)
						.title("Book eCashless from home")
						.subtitle("You can now plan a cashless hospitalization from the comfort of your home at least 48 hours prior to expected date of admission.")
						.images([
							new builder.CardImage(session)
								.url('https://i.imgur.com/YV8DQ05.png')
								.alt('Book E-Cashless')
						])
						.buttons([
							builder.CardAction.openUrl(session, "https://m.medibuddy.in/submitecashless.aspx", "Book eCashless Hospitalization"),
							builder.CardAction.openUrl(session, "https://www.mediassistindia.com/ecashless-paving-the-way-for-digital-transformation/", "Read more about eCashless")						
							]);
			cards.push(bookECashlessCard);
			const msg = new builder.Message(session);
			msg.attachmentLayout(builder.AttachmentLayout.carousel)
				.text("Here's what I found to help you with planning your cashless hospitalization: ")
				.attachments(cards);
			session.send(msg);
		}
		
		const msg = new builder.Message(session);
			msg.text("Would any of these topics be of interest to you?")
				.addAttachment(new builder.HeroCard(session)
						.images([
							new builder.CardImage(session)
								.url('https://i.imgur.com/7XCSpue.png')
								.alt('Other Help Topics')
						])
						.buttons([
							builder.CardAction.openUrl(session, "https://www.mediassistindia.com/get-insights-into-your-non-medical-expenses-now-with-medibuddy/", "Non Medical Expenses"),
							builder.CardAction.openUrl(session, "https://www.mediassistindia.com/ecashless-paving-the-way-for-digital-transformation/", "Difference between claimed and approved amount"),
							builder.CardAction.openUrl(session, "https://www.mediassistindia.com/hospitalization-claims-and-expenses-things-you-should-know/", "Raising reimbursement claims for pre- and post-hospitalization expenses"),
							builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/", "Medicines and post-operative home healthcare")								
							]));
			session.send(msg);
			
			session.endDialog();


	}
])
.triggerAction({
	matches: /^help$/i,
	onSelectAction: (session, args) => {
		session.beginDialog(args.action, args);
	}
});

//------------------------------------------------------------------------------------------------------------------------------------------------//


// Dialog to Download E-Card
bot.dialog('downloadEcard',[
	function (session){
		session.send("Welcome to E-Card Download Center️ 🎊️️🎈🎉");
		session.beginDialog('askforDownloadBy');
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/download e-card/i, /download ecard/i, /ecard/i, /tpa card/i, /insurance card/i, /card/i, /download card/i, /^download e-card$/i],
	// /^download e-card$/i,
	confirmPrompt: "⚠️ This will cancel your current request. Are you sure? (yes/no)"
	
});

// Dialog to ask for Download By
bot.dialog('askforDownloadBy',[
	function (session){
		var msg = new builder.Message(session)
			.text("Let's get started 🚀. There are four ways to download your e-card. Please select one of the following options: ")
			.suggestedActions(
				builder.SuggestedActions.create(
					session, [
						builder.CardAction.imBack(session, "Download with Claim ID", "Download with Claim ID"),
						builder.CardAction.imBack(session, "Download with Medi Assist ID", "Download with Medi Assist ID"),
						builder.CardAction.imBack(session, "Download with Employee ID", "Download with Employee ID"),
						builder.CardAction.imBack(session, "Download with Policy Number", "Download with Policy Number")
					])
			);
		session.send(msg);	
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

//Custom redirect to Track with Claim ID
bot.customAction({
	matches: /^Download with Claim ID$/gi,
	onSelectAction: (session, args, next) => {
		session.beginDialog('downloadwID');
		
	}
});

//Custom redirect to Download with Medi Assist ID
bot.customAction({
	matches: /^Download with Medi Assist ID$/gi,
	onSelectAction: (session, args, next) => {
		session.beginDialog('downloadwMAID');
		
	}
});

//Custom redirect to Download with Employee ID
bot.customAction({
	matches: /^Download with Employee ID$/gi,
	onSelectAction: (session, args, next) => {
		session.beginDialog('downloadwEmpID');
		
	}
});

//Custom redirect to Download with Policy Number
bot.customAction({
	matches: /^Download with Policy Number$/gi,
	onSelectAction: (session, args, next) => {
		session.beginDialog('downloadwPolNo');
		
	}
});


// Dialog to ask for Confirmation - Download with Claim Number
bot.dialog('askforDownloadwIDConfirmation',[
	function (session){
		builder.Prompts.confirm(session, "💡 Let's try again? (yes/no)")
	},
	function (session, results) {
		if (results.response){
			session.replaceDialog('downloadwID', {reprompt: true});
		}
		else {
			session.endConversation();
			session.beginDialog('askforMore');
		}
		
	}
]);

// Dialog to ask for Confirmation - Download with Medi Assist ID
bot.dialog('askforDownloadwMAIDConfirmation',[
	function (session){
		builder.Prompts.confirm(session, "💡 Let's try again? (yes/no)")
	},
	function (session, results) {
		if (results.response){
			session.replaceDialog('downloadwMAID', {reprompt: true});
		}
		else {
			session.endConversation();
			session.beginDialog('askforMore');
		}
		
	}
]);

// Dialog to ask for Confirmation - Download with Employee ID
bot.dialog('askforDownloadwEmpIDConfirmation',[
	function (session){
		builder.Prompts.confirm(session, "💡 Let's try again? (yes/no)")
	},
	function (session, results) {
		if (results.response){
			session.replaceDialog('downloadwEmpID', {reprompt: true});
		}
		else {
			session.endConversation();
			session.beginDialog('askforMore');
		}
		
	}
]);

// Dialog to ask for Confirmation - Download with Policy Number
bot.dialog('askforDownloadwPolNoConfirmation',[
	function (session){
		builder.Prompts.confirm(session, "💡 Let's try again? (yes/no)")
	},
	function (session, results) {
		if (results.response){
			session.replaceDialog('downloadwPolNo', {reprompt: true});
		}
		else {
			session.endConversation();
			session.beginDialog('askforMore');
		}
		
	}
]);

/* 
bot.dialog('askforDownloadBy',[
	function (session){
		builder.Prompts.choice(session, "There are four ways to track your claim:", downloadMenu, builder.ListStyle.button);		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

 */
// Dialog to ask for Beneficiary Name
bot.dialog('askforbenefName',[
	function (session){
		builder.Prompts.text(session, "Please provide name of the primary beneficiary");		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

// Dialog to Download E-Card with Claim Number
bot.dialog('downloadwID', [
				function (session){
						session.beginDialog('askforClaimNumber');
				},	
				function (session, results) {
					var clmNoChecker = /^\d{8}$/.test(results.response);
					if(JSON.stringify(clmNoChecker) == "true"){
						session.dialogData.claimNumber = results.response;
						session.beginDialog('askforbenefName');
					}
					else{
						session.send("⚠️ The claim number should only be numeric and eight digits long.");
						session.beginDialog('askforDownloadwIDConfirmation');
					}
				},
				function (session, results) {
					session.dialogData.benefName = results.response;

					// Process request and display reservation details
					session.send("Finding Medi Assist E-Card with details 🔎 <br/>Claim Number: %s<br/>Beneficiary Name: %s",
						session.dialogData.claimNumber, session.dialogData.benefName);
					
					var clmId = session.dialogData.claimNumber;
					var benefName = session.dialogData.benefName;
					
					var downloadlink = 'http://track-api-lb.medibuddy.in/getecard/ClaimId/'+clmId+'/'+benefName;
					
					//Make POST request to MA Server
					var request = require('request');	
					
					// Set the headers
					var headers = {
						'User-Agent':       'Super Agent/0.0.1',
						'Content-Type':     'application/x-www-form-urlencoded'
					}

					// Configure the request
					var options = {
						url: downloadlink,
						method: 'GET',
						headers: headers
					}

					// Start the request
					response = request(options, function (error, response, body) {
						if (!error && response.statusCode == 200) {	
							var sizeof = require('object-sizeof');
							console.log(sizeof(body));
							
							if(sizeof(body) > 0){
								session.userData.downloadURL = downloadlink;
								var ecard = createHeroCard(session);
								var msg = new builder.Message(session).addAttachment(ecard);
								session.send(msg);
								session.sendTyping();
								setTimeout(function () {
									session.endConversation();	
									session.beginDialog('askforMore');
								}, 5000);		
								
							}
							else if (sizeof(body) == 0){
								session.send('⚠️ I was unable to find your e-card with the details you provided. ');
								session.beginDialog('askforDownloadwIDConfirmation');
							}
						}
						else{
								session.send('⚠️ I was unable to find your e-card with the details you provided. ');
								session.beginDialog('askforDownloadwIDConfirmation');
						}
					});
					session.endDialog();
				}
]);

// Dialog to Download E-Card with Medi Assist ID
bot.dialog('downloadwMAID', [
				function (session){
						session.beginDialog('askforMAID');
				},	
				function (session, results) {
					
					session.dialogData.MAID = results.response;
					
					var clmMAIDChecker = /^\d{10}$/.test(results.response);
					if(JSON.stringify(clmMAIDChecker) == "true"){
						session.beginDialog('askforbenefName');
						session.dialogData.MAID = results.response;
					}
					else{
						session.send("⚠️ The Medi Assist ID should only be numeric and ten digits long.");
						session.beginDialog('askforDownloadwMAIDConfirmation');
					}
				},
				function (session, results) {
					session.dialogData.benefName = results.response;

					// Process request and display reservation details
					session.send("Finding Medi Assist E-Card with details 🔎 <br/>Medi Assist ID: %s<br/>Beneficiary Name: %s",
						session.dialogData.MAID, session.dialogData.benefName);
					
					var MAID = session.dialogData.MAID;
					var benefName = session.dialogData.benefName;
					
					var downloadlink = 'http://track-api-lb.medibuddy.in/getecard/MAID/'+MAID+'/'+benefName+'/9190';
					
					//Make POST request to MA Server
					var request = require('request');	
					
					// Set the headers
					var headers = {
						'User-Agent':       'Super Agent/0.0.1',
						'Content-Type':     'application/x-www-form-urlencoded'
					}

					// Configure the request
					var options = {
						url: downloadlink,
						method: 'GET',
						headers: headers
					}

					// Start the request
					response = request(options, function (error, response, body) {
						if (!error && response.statusCode == 200) {	
							var sizeof = require('object-sizeof');
							console.log(sizeof(body));
							
							if(sizeof(body) > 0){
								session.userData.downloadURL = downloadlink;
								var ecard = createHeroCard(session);
								var msg = new builder.Message(session).addAttachment(ecard);
								session.send(msg);
								session.sendTyping();
								setTimeout(function () {
									session.endConversation();
									session.beginDialog('askforMore');
								}, 5000);		
								
							}
							else if (sizeof(body) == 0){
								session.send('⚠️ I was unable to find your e-card with the details you provided. Let\'s retry.');
								session.beginDialog('askforDownloadwMAIDConfirmation');
							}
						}
						else{
								session.send('⚠️ I was unable to find your e-card with the details you provided. Let\'s retry.');
								session.beginDialog('askforDownloadwMAIDConfirmation');							
						}
					});
					
					session.endDialog();
				}
]);

// Dialog to Download E-Card with Employee Details
bot.dialog('downloadwEmpID', [
				function (session){
						session.beginDialog('askforEmpID');
				},	
				function (session, results) {
					session.dialogData.EmpID = results.response;
					session.beginDialog('askforCorporate');
				},
				function (session, results) {
					session.dialogData.Corporate = results.response;
					session.beginDialog('askforbenefName');
				},
				function (session, results) {
					session.dialogData.benefName = results.response;

					// Process request and display reservation details
					session.send("Finding Medi Assist E-Card with details 🔎<br/>Employee ID: %s<br/>Corporate: %s<br/>Beneficiary Name: %s",
						session.dialogData.EmpID, session.dialogData.Corporate, session.dialogData.benefName);
					
					var EmpID = session.dialogData.EmpID;
					var Corporate = session.dialogData.Corporate;
					var benefName = session.dialogData.benefName;
					
					var downloadlink = 'http://track-api-lb.medibuddy.in/getecard/EmployeeId/'+EmpID+'/'+benefName+'/'+Corporate;
					
					//Make POST request to MA Server
					var request = require('request');	
					
					// Set the headers
					var headers = {
						'User-Agent':       'Super Agent/0.0.1',
						'Content-Type':     'application/x-www-form-urlencoded'
					}

					// Configure the request
					var options = {
						url: downloadlink,
						method: 'GET',
						headers: headers
					}

					// Start the request
					response = request(options, function (error, response, body) {
						if (!error && response.statusCode == 200) {	
							var sizeof = require('object-sizeof');
							console.log(sizeof(body));
							
							if(sizeof(body) > 0){
								session.userData.downloadURL = downloadlink;
								var ecard = createHeroCard(session);
								var msg = new builder.Message(session).addAttachment(ecard);
								session.send(msg);
								session.sendTyping();
								setTimeout(function () {
									session.endConversation();
									session.beginDialog('askforMore');
								}, 5000);		
								
							}
							else if (sizeof(body) == 0){
								session.send('⚠️ I was unable to find your e-card with the details you provided. Let\'s retry.');
								session.beginDialog('askforDownloadwEmpIDConfirmation');
							}
						}
						else{
								session.send('⚠️ I was unable to find your e-card with the details you provided. Let\'s retry.');
								session.beginDialog('askforDownloadwEmpIDConfirmation');
						}
					});
					
					session.endDialog();
				}
]);

// Dialog to Download E-Card with Policy Number
bot.dialog('downloadwPolNo', [
				function (session){
						session.beginDialog('askforPolNo');
				},	
				function (session, results) {
					session.dialogData.PolNo = results.response;
					session.beginDialog('askforbenefName');
				},
				function (session, results) {
					session.dialogData.benefName = results.response;

					// Process request and display reservation details
					session.send("Finding Medi Assist E-Card with details 🔎 <br/>Policy Number: %s<br/>Beneficiary Name: %s",
						session.dialogData.PolNo, session.dialogData.benefName);
					
					var PolNo = (session.dialogData.PolNo).replace(/\//g, "");
					console.log(PolNo);
					var benefName = session.dialogData.benefName;
					
					var downloadlink = 'http://track-api-lb.medibuddy.in/getecard/PolicyNo/'+PolNo+'/'+benefName;
					
					//Make POST request to MA Server
					var request = require('request');	
					
					// Set the headers
					var headers = {
						'User-Agent':       'Super Agent/0.0.1',
						'Content-Type':     'application/x-www-form-urlencoded'
					}

					// Configure the request
					var options = {
						url: downloadlink,
						method: 'GET',
						headers: headers
					}

					// Start the request
					response = request(options, function (error, response, body) {
						if (!error && response.statusCode == 200) {	
							var sizeof = require('object-sizeof');
							console.log(sizeof(body));
							
							if(sizeof(body) > 0){
								session.userData.downloadURL = downloadlink;
								var ecard = createHeroCard(session);
								var msg = new builder.Message(session).addAttachment(ecard);
								session.send(msg);
								session.sendTyping();
								setTimeout(function () {
									session.endConversation();
									session.beginDialog('askforMore');
								}, 5000);		
								
							}
							else if (sizeof(body) == 0){
								session.send('⚠️ I was unable to find your e-card with the details you provided.');
								session.beginDialog('askforDownloadwPolNoConfirmation');
							}
						}
						else{
								session.send('⚠️ I was unable to find your e-card with the details you provided.');
								session.beginDialog('askforDownloadwPolNoConfirmation');
						}
					});
					
					session.endDialog();
				}
]);

function createHeroCard(session) {
    return new builder.HeroCard(session)
        .title('Download Medi Assist E-Card')
        .subtitle('ℹ️ Flash this E-Card upon request at the insurance desk in the hospital at the time of admission')
        .text('')
        .images([
            builder.CardImage.create(session, 'https://i.imgur.com/RKYzoRi.png')
        ])
        .buttons([
            builder.CardAction.openUrl(session, session.userData.downloadURL, 'Download E-Card 📥')
        ]);
};

// Dialog to Search Network Hospitals
bot.dialog('searchNetwork',[
	function (session){
		session.beginDialog('askforLocation');
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/search network hospitals/i, /search network/i, /search nearby hospitals/i, /search providers/i, /hospitals around/i],
	// /^search network hospitals$|^search network$/i,
	confirmPrompt: "⚠️ This will cancel your current request. Are you sure? (yes/no)"
	
});

// Dialog to ask for Confirmation - Download with Medi Assist ID
bot.dialog('askforLocationConfirmation',[
	function (session){
		builder.Prompts.confirm(session, "💡 Let's try again? (yes/no)")
	},
	function (session, results) {
		if (results.response){
			session.replaceDialog('askforLocation', {reprompt: true});
		}
		else {
			session.endConversation();
			session.beginDialog('askforMore');
		}
		
	}
]);

// Function to check if returned JSON object is empty
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

bot.dialog('askforLocation',  [
    function (session) {
		var locationDialog = require('botbuilder-location');
		bot.library(locationDialog.createLibrary("AjgT49m-_PFYGm_KAZ4nBmOxyNeEyCQXSV_ybfF3wLtebeCDoYVT0JNyOpnB-Y62"));
		
		var options = {
			prompt: "Where should I search for hospitals? 🏥. Type your city.",
			useNativeControl: true,
			reverseGeocode: true,
			skipFavorites: true,
			skipConfirmationAsk: true
		};
		locationDialog.getLocation(session, options);

    },
    function (session, results) {
        if (results.response) {
			session.userData.place = results.response;
			var place = session.userData.place;
			session.userData.lat = JSON.stringify(place.geo.latitude);
			session.userData.lng = JSON.stringify(place.geo.longitude);
			session.beginDialog('askforInsurer');	
        }
		else{
			session.send("I was not able to fetch your address 😞. Let's retry");
			session.beginDialog('askforLocation');
		}
    },
	function (session, results) {
		if (results.response){
			session.userData.insurer = results.response;
			const client = new Wit({accessToken: "YYXX4OGOYWHGWEDZGT72PQRUEJQHBRNM"});
			client.message(session.userData.insurer, {})
			.then((data) => {
			  entities = data['entities'];
			  for (var entity in entities){
				session.userData.insurer = data['entities'][entity][0]['value'];
			  }
			  })
			.catch(console.error);
			session.beginDialog('askforSpeciality');		
		}
	},
	function (session, results) {
		if (results.response){
			session.userData.speciality = results.response;	
			const client = new Wit({accessToken: "YYXX4OGOYWHGWEDZGT72PQRUEJQHBRNM"});
			client.message(session.userData.speciality, {})
			.then((data) => {
			  entities = data['entities'];
			  for (var entity in entities){
				session.userData.speciality = data['entities'][entity][0]['value'];
			  }
			  })
			.catch(console.error);
	
			//Make POST request to MA Server
			var request = require('request');
			
			// Set the headers
			var headers = {
				'User-Agent':       'Super Agent/0.0.1',
				'Content-Type':     'application/x-www-form-urlencoded'
			}

			// Configure the request
			var options = {
				url: 'https://track.medibuddy.in/api/GetHospitalsByLocation/.json',
				method: 'POST',
				headers: headers,
				form: {"insuranceCompany":session.userData.speciality,"latitude":session.userData.lat,"longitude":session.userData.lng,"distance":10,"hospSpeciality":session.userData.speciality,"maRating":""}
			}

			// Start the request
			response = request(options, function (error, response, body) {
				if (!error && response.statusCode == 200) {	
					// Print out the response body
					data = JSON.parse(body);
					console.log(data);
					if(JSON.stringify(data.isSuccess) === "true"){				
						var cards = [];
						
					if(isEmptyObject(data.hospitals)){
						session.send("⚠️ Sorry! Could not find any hospitals based on your search request.");
						session.beginDialog('askforLocationConfirmation');
					}
					else{
						
						for (var item in data.hospitals){	
							// Get Distance between User and Hospital
							var geolib = require("geolib");						
							data.hospitals[item].dist = geolib.getDistance(
									{latitude: JSON.parse(session.userData.lat), longitude: JSON.parse(session.userData.lng)},
									{latitude: data.hospitals[item].latitude, longitude: data.hospitals[item].longitude}
									);													
						}
						
						data.hospitals.sort(function(a, b) { return a.dist - b.dist})
						.slice(0, 10);
												
						for (var item in data.hospitals){
							var nwHospAddress = JSON.stringify(data.hospitals[item].address);	
							var nwHospPhNo = data.hospitals[item].phone.split('/')[0];								
							nwHospPhNo = nwHospPhNo.replace(/-/g,'');
							
							if(item < 10){
								cards.push(
									new builder.HeroCard(session)
									.title(data.hospitals[item].name + " (" + data.hospitals[item].dist + " meters)")
									.subtitle("Phone: " + data.hospitals[item].phone)
									.text(nwHospAddress + ', ' + data.hospitals[item].city + ', ' + data.hospitals[item].state + ', ' + data.hospitals[item].pinCode)
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/OaMnJ52.png')
											.alt(data.hospitals[item].name)
									])
									.buttons([
										builder.CardAction.openUrl(session, "tel:"+nwHospPhNo, "Call Hospital"),
										builder.CardAction.openUrl(session, "http://maps.google.com/maps?q="+data.hospitals[item].latitude+","+data.hospitals[item].longitude, "View Hospital"),
										builder.CardAction.openUrl(session, "https://m.medibuddy.in/PlannedHospitalization.aspx?hospid="+data.hospitals[item].id+"&hospname="+data.hospitals[item].name, "Submit eCashless")
									])
								);
							}else{ break;}
							
						}

						session.send("Trying to find hospitals near you 🏥. Please wait ⏳");
						session.sendTyping();
						var msg = new builder.Message(session);
							msg.attachmentLayout(builder.AttachmentLayout.carousel)
							.attachments(cards);
						session.send(msg);						
						session.sendTyping();
						setTimeout(function () {
							session.endConversation();
							session.beginDialog('askforMore');
						}, 5000);		
					}
					}
				}
			});				
		}
	}
]);

function getFormattedAddressFromPlace(place, separator) {
    var addressParts = [place.streetAddress, place.locality, place.region, place.postalCode, place.country, place.latitude, place.longitude];
    return addressParts.filter(i => i).join(separator);
}

// Dialog to ask for Insurer Name
bot.dialog('askforInsurer',[
	function (session){
		builder.Prompts.text(session, "Please provide your `Insurer` name");		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

// Dialog to ask for Speciality
bot.dialog('askforSpeciality',[
	function (session){
		builder.Prompts.text(session, "What is the medical `speciality` you're looking for. Eg: `Dermatology`, `Orthopedics`, `Kidney`, `Cardiac & Circulatory Disorder` etc.");		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

// -----------------------------------------------------------------------------------------------------------------------------------------------------

// REDIRECTS

// Dialog to redirect to Call Center
bot.dialog('askforCallCenter',[
	function (session){
		session.send("ℹ️ You can reach our call center at `1800 425 9449` or write to `gethelp@mahs.in` for claim related queries");
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/customer/i, /support/i, /call center/i, /call centre/i, /customer service/i, /cc number/i, /cc/i, /helpline/i, /toll/i, /tech support/i, 'CustomerCare']
	// /^customer$|^support$|^call centre$|^customer service$|^ cc number$|^cc$|^helpline$|^toll free$|^call center$/i,
	
});

// Dialog to redirect to HR
bot.dialog('askforHR',[
	function (session){
		session.send("ℹ️ For recent updates on career opportunities, kindly check out the \"Careers\" tab on our Medi Assist facebook page or mail us at `harish.dasepalli@mahs.in`");
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/HR/i, /join.*company/i, /hr department/i, /human resource/i, /hr dept/i, /career/i, /job/i, /join/i, /opportunity/i, /opportunities/i, /opening/i, /fresher/i, 'HR']
	// /^HR$|^human resource$|^hr dept$|^hr department$|^ join.*company$|^careers$|^career$|^job$|^join$|^job|^opportunit$|^opening$|^fresher$|^$|^$/i,
	
});

// Dialog to redirect to Investigation
bot.dialog('askforInvestigation',[
	function (session){
		session.send("ℹ️ Thank you for your valuable feedback. We will notify our investigation team");
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/investigation/i, /forge/i, /malpractice/i, /fishy/i, /suspicious/i, /fordge/i]
	
});

// Dialog to redirect to Grievance
bot.dialog('askforGrievance',[
	function (session){
		session.send("ℹ️ We sincerely regret for the unpleasant experience! I request you to write to us on `gethelp@mahs.in` or call us on our toll free no `1800 425 9449`. Alternatively, you can also download MediBuddy and track your claim on real time basis");
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/grievance/i, /disappoint/i, /angry/i ,/disappointed/i, /dissatisfied/i, /unhappy/i, /horrible/i, /worst/i, /bad/i, /poor/i, /not settled/i, /not paid/i, /not received/i, /very poor/i, /very bad/i, /terrible/i, /not received any amount/i, /not intimated the hospital/i, /not working/i, /support is slow/i, /I did not get/i, /bad service/i, /I did not receive/i, /bad service/i, /bad tpa/i, /bad/i, /worst/i, /complaint/i, 'Grievance'],
	
});

// Dialog to redirect to Offshore
bot.dialog('askforOffshore',[
	function (session){
		session.send("ℹ️ For further assistance you can either write to `gethelp@mahs.in` or call on our \"Overseas\" contact number at `91-80-67617555`");
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/offshore/i, /abroad/i, /overseas contact number/i, /USA/i, /Australia/i, /overseas/i]
	
});

// Dialog to redirect to General Query
bot.dialog('askforGeneralQuery',[
	function (session){
		session.endConversation("ℹ️ For all your claim/application (MediBuddy)/transaction related queries kindly write to `gethelp@mahs.in` or call us at `1800 425 9449`");
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/register/i, /application/i, /app/i, /medibuddy/i, /transaction/i, /query/i, /queries/i, /question/i, /doubt/i, /clarify/i, /clarity/i, /contact information/i, /registration/i, /can i submit/i, /for how many days/i, /how many/i, /help us urgently/i, /help us/i, /purchase/i, /buy/i, /how much/i, /log in/i, /please guide/i, /responding/i, /please help/i]
	
});

// Dialog to handle abuse
bot.dialog('askforAbuse',[
	function (session){
		session.send("🚫 Hey, that language is uncalled for! I request you to write to us on `gethelp@mahs.in` or call us on our toll free no `1800 425 9449`. Alternatively, you can also download MediBuddy and track your claim on real time basis");
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/anal/i, /ass/i, /asshole/i ,/balls/i, /bitch/i, /butt/i, /fuck/i, /cum/i, /cunt/i, /cock/i, /retard/i, /psycho/i, /mental/i, /finger/i, /jerk/i, /nudity/i, /milf/i, /piss/i, /shit/i, /rape/i, /tit/i, /vagina/i, /sucker/i, /sex/i, /semen/i, /slut/i, /hump/i, /suck/i, 'Abuse']
});

// Get random integer between min (inclusive) and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Dialog to handle goodbye
bot.dialog('sayGoodbye',[
	function (session){
		msg = ["See you later 👋, Keep rocking!","See you 👋!","Have a good day.","Later gator!","Talking to you makes my day. Come back soon!", "Ok, bye🙂!", "Till next time!"]
		x = getRandomInt(0,6);
		session.send(msg[x]);
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/bye/i, /see you/i, /cu/i ,/ciao/i, /ta ta/i, /cheerio/i, /cheers/i, /gtg/i, /got to go/i,/bai/i, /c u/i, /l8r/i, /exit/i, /quit/i, /take care/i, /cya/i, /shalom/i, /sayonara/i, /farewell/i, /later/i, /so long/i, /peace out/i, /see you/i]
	
});

// Dialog to handle Compliment
bot.dialog('sayThanks',[
	function (session){
		msg = ["Welcome, It's nothing","👍","That's all right!","Don't mention it.","😊","😍", "That's very kind of you", "Thank you, I appreciate the compliment.", "Thank you very much. 🙏","All I can say is, Thanks!", "MediBuddy appreciates your gratitude! We wish you good health and smiles 🙂"]
		x = getRandomInt(0,10);
		session.send(msg[x]);
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
])
.triggerAction({
	matches: [/thanks/i, /👍/i,/thx/i, /thank/i ,/helpful/i, /kind/i, /You're great/i, /great/i, /amazing/i, /brilliant/i, /excellent/i, /awesome/i, /amazing/i, /love/i, /cute/i, /awww/i, /i like you/i, /like/i]
	
});

//-------------------------------------------------------------------------------------------------------------------------------------

// INIFINITI SERVICES
// Dialog to display health check card - Facebook
bot.dialog('displayhealthcheckFB',
	function (session){
		healthcheckCard = new builder.HeroCard(session)
									.title("Health Check Packages")
									.subtitle("Click below to view packages from hospitals in your city")
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/UZXZjqO.png')
											.alt('Health Check Packages')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/", "View Packages")
										]);
		session.endConversation(new builder.Message(session)
			.addAttachment(healthcheckCard));		
	}
);

// Dialog to display medicine card - Facebook
bot.dialog('displaymedicineFB',
	function (session){
		medicineCard = new builder.HeroCard(session)
									.title("Order Medicine")
									.subtitle("Book prescription medicines effortlessly")
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/oCmpQ56.png')
											.alt('Order Medicine')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/", "Order Medicines")
										]);
		session.send(new builder.Message(session)
			.addAttachment(medicineCard));	
	}
);

// Dialog to display consultation card - Facebook
bot.dialog('displayconsultationFB',
	function (session){
			consultationCard = new builder.HeroCard(session)
									.title("Consultation")
									.subtitle("Select your city and speciality to book your preferred consultation. Click below to know more")
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/E8kTRGq.png')
											.alt('Consultations')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/", "View Consultations")
										]);
		session.send(new builder.Message(session)
			.addAttachment(consultationCard));
	}
);

// Dialog to display home health care card - Facebook
bot.dialog('displayhomehealthcareFB',
	function (session){
			homehealthcareCard = new builder.HeroCard(session)
									.title("Home Health Care")
									.subtitle("Choose your city and Service to view the list of Home Health Care packages available.")
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/NOVSZ7T.png')
											.alt('Home Health Care')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/", "View Services")
										]);
		session.send(new builder.Message(session)
			.addAttachment(homehealthcareCard));
	}
);

// Dialog to display tele consultation card - Facebook
bot.dialog('displayteleconsultationFB',
	function (session){

		teleconsultationCard = new builder.HeroCard(session)
								.title("Tele Consultation")
								.subtitle("Book a telephonic consultation with our medical professionals at the lowest cost. Click below to learn more.")
								.images([
									new builder.CardImage(session)
										.url('https://i.imgur.com/Ps8hw1x.png')
										.alt('Tele Consultation')
								])
								.buttons([
									builder.CardAction.imBack(session, "https://infiniti.medibuddy.in/onlineservice/4f81d4702c8242009081cfde6301dd38//General%20Physician", "Tele Consultation")
									]);
		
		session.send(new builder.Message(session)
			.addAttachment(teleconsultationCard));	
	}
);// Dialog to display lab test card - Facebook
bot.dialog('displaylabtestFB',
	function (session){
		labtestCard = new builder.HeroCard(session)
								.title("Lab Test")
								.subtitle("Click below to view available lab tests in your city")
								.text("https://infiniti.medibuddy.in")
								.images([
									new builder.CardImage(session)
										.url('https://i.imgur.com/Y3DtlFx.png')
										.alt('Lab Test')
								])
								.buttons([
									builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/labtest/f4a83a18cec74f1786b8fd2b9aff4c0c//Platelet%20Count/?c=Bengaluru/", "View Lab Tests")
									]);
		session.send(new builder.Message(session)
			.addAttachment(labtestCard));
	}
);
/* 
// Dialog to ask for Healthcheck Category - Facebook
bot.dialog('askforhealthcheckCategoryFB',
	function (session, args, next){
		const categorylist = ['Preventive', 'Diabetes', 'Cardiac', 'Cancer'];
		const card = new builder.ThumbnailCard(session)
					.text('Please choose from the list of categories')
					.title('Categories')
					.buttons(categorylist.map(choice => new builder.CardAction.imBack(session, choice, choice)));
		const message = new builder.Message(session)
						.addAttachment(card);
		builder.Prompts.choice(session, message, categorylist);		
	},
	function(session, results, next) {
		if(results.response && results.response.entity){
			session.userData.healthcheckCategory = results.response.entity;
			session.endDialog(`You chose ${results.response.entity}`);
		}
		else	
			session.endDialog(`Sorry, i didn't understand your choice.`);
	}
); */

// Dialog to 
bot.dialog('healthCheck',[
	function (session){
		session.beginDialog('askforhealthcheckCity');
	},
	function(session, results){	
		session.endDialogWithResult(results);		
	}
])
.triggerAction({
	matches: [/health check/i, /health check up/i, /check up/i, /health check package/i],
	// /^search network hospitals$|^search network$/i,
	confirmPrompt: "⚠️ This will cancel your current request. Are you sure? (yes/no)"
	
});


// Dialog to ask for Health Check city
bot.dialog('askforhealthcheckCity',[
	function (session){
		//Make POST request to MA Server
		
			if(session.message && session.message.value){
				processSubmitAction(session, session.message.value);
				session.endConversation();
				session.beginDialog('askforMore');
				return;
			}

			if(session.message.address.channelId === 'facebook'){
				session.beginDialog('displayhealthcheckFB');
				return;
			}
				var card = 
				{
				  "contentType": "application/vnd.microsoft.card.adaptive",
				 "content": {
					 
					"type": "AdaptiveCard",
					 "body": [
						{
						  "type": "TextBlock",
						  "text": "Select Filters: Health Check",
						  "weight": "bolder",
						  "size": "medium"
						},
						{
						  "type": "TextBlock",
						  "text": "We are one step away. Please choose city and category from options below.",
						  "wrap": true,
						  "maxLines": 4
						},
						{
						  "type": "TextBlock",
						  "text": "Choose your City"
						},
						{
						  "type": "Input.ChoiceSet",
						  "id": "city",
						  "style":"compact",
						  "choices": [
							{
							  "title": "Bengaluru",
							  "value": "Bengaluru",
							  "isSelected": true
							},
							{
								"title": "Chennai",
								"value": "Chennai"
							},
							{
								"title": "Delhi",
								"value": "Delhi"
							},
							{
								"title": "Hyderabad",
								"value": "Hyderabad"
							},
							{
								"title": "Kolkata",
								"value": "Kolkata"
							},
							{
								"title": "Mumbai",
								"value": "Mumbai"
							},
							{
								"title": "Pune",
								"value": "Pune"
							},
							{
								"title": "Other",
								"value": "Other"
							}
							
						  ]
						},
						{
						  "type": "TextBlock",
						  "text": "Select your Category"
						},
						{
						  "type": "Input.ChoiceSet",
						  "id": "category",
						  "style":"expanded",
						  "isMultiSelect": false,
						  "choices": [
							{
							  "title": "Preventive",
							  "value": "Preventive",
							  "isSelected": true
							},
							{
							  "title": "Diabetes",
							  "value": "Diabetes"
							},
							{
							  "title": "Cardiac",
							  "value": "Cardiac"
							},
							{
							  "title": "Cancer",
							  "value": "Cancer"
							}
						  ]
						}
					  ],
					  "actions": [
					  {
							"type": "Action.Submit",
							"title": "Find Packages"
					  }
					  ]
				 }
				};
				session.send(new builder.Message(session)
					.addAttachment(card));
			
		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

function processSubmitAction(session, message){
		session.userData.healthcheckCity = message["city"];
		session.userData.healthcheckCategory = message["category"];	
		if(message["city"] !== "Other"){
			if(session.message.address.channelId === 'facebook'){
					session.beginDialog('displayhealthcheckFB');
					return;
			}
			healthcheckCard = new builder.HeroCard(session)
									.title("Health Check Packages")
									.subtitle("Click below to view packages from hospitals in your city")
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/UZXZjqO.png')
											.alt('Health Check Packages')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/result/package/c920aa2144b9e51184af002219349965/"+session.userData.healthcheckCategory+"//"+"/?c="+session.userData.healthcheckCity, "Show Packages")
										]);
		}
		else{
			
			if(session.message.address.channelId === 'facebook'){
					session.beginDialog('displayhealthcheckFB');
					return;
			}
		healthcheckCard = new builder.HeroCard(session)
									.title("Health Check Packages")
									.subtitle("Click below to view packages from hospitals in your city")
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/UZXZjqO.png')
											.alt('Health Check Packages')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/", "Visit MediBuddy Infiniti")
										]);
		}	
		session.send(new builder.Message(session)
			.addAttachment(healthcheckCard));
		
}


// Dialog to Order Medicines
bot.dialog('medicine',[
	function (session){
		session.beginDialog('askformedicineCity');
	},
	function(sesison, results){	
		session.endDialogWithResult(results);		
	}
])
.triggerAction({
	matches: [/medicine/i, /medicines/i, /prescription/i, /pharmacy/i, /tablet/i, /syrup/i, /drugs/i],
	// /^search network hospitals$|^search network$/i,
	confirmPrompt: "⚠️ This will cancel your current request. Are you sure? (yes/no)"
	
});


// Dialog to ask for Medicine city
bot.dialog('askformedicineCity',[
	function (session){
		//Make POST request to MA Server
		
			if(session.message && session.message.value){
				processSubmitAction2(session, session.message.value);
				session.endConversation();
				session.beginDialog('askforMore');
				return;
			}

			
			if(session.message.address.channelId === 'facebook'){
				session.beginDialog('displaymedicineFB');
				return;
			}

				var card = 
				{
				  "contentType": "application/vnd.microsoft.card.adaptive",
				 "content": {
					 
					"type": "AdaptiveCard",
					 "body": [
						{
						  "type": "TextBlock",
						  "text": "Select Filters: Order Medicines",
						  "weight": "bolder",
						  "size": "medium"
						},
						{
						  "type": "TextBlock",
						  "text": "We are one step away. Please choose city and enter your pincode below.",
						  "wrap": true,
						  "maxLines": 4
						},
						{
						  "type": "TextBlock",
						  "text": "Choose your City"
						},
						{
						  "type": "Input.ChoiceSet",
						  "id": "city",
						  "style":"compact",
						  "choices": [
							{
							  "title": "Bengaluru",
							  "value": "Bengaluru",
							  "isSelected": true
							},
							{
								"title": "Chennai",
								"value": "Chennai"
							},
							{
								"title": "Delhi",
								"value": "Delhi"
							},
							{
								"title": "Hyderabad",
								"value": "Hyderabad"
							},
							{
								"title": "Kolkata",
								"value": "Kolkata"
							},
							{
								"title": "Mumbai",
								"value": "Mumbai"
							},
							{
								"title": "Pune",
								"value": "Pune"
							},
							{
								"title": "Ahmedabad",
								"value": "Ahmedabad"
							},
							{
								"title": "Gurgaon",
								"value": "Gurgaon"
							},
							{
								"title": "Jaipur",
								"value": "Jaipur"
							},
							{
								"title": "Navi Mumbai",
								"value": "Navi Mumbai"
							},
							{
								"title": "Noida",
								"value": "Noida"
							},
							{
								"title": "Thane",
								"value": "Thane"
							}
							
						  ]
						},
						{
						  "type": "TextBlock",
						  "text": "Enter your pincode"
						},
						{
						  "type": "Input.Number",
						  "id": "pincode",
						  "placeholder": "Enter pincode, let's check if we operate in your area!",
						  "speak": "What is your pincode?"
						}
					  ],
					  "actions": [
					  {
							"type": "Action.Submit",
							"title": "Search"
					  }
					  ]
				 }
				};
				session.send(new builder.Message(session)
					.addAttachment(card));
			
		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

function processSubmitAction2(session, message){
		session.userData.medicineCity = message["city"];
		if(session.message.address.channelId === 'facebook'){
			session.beginDialog('displaymedicineFB');
			return;
		}		
		if(message["pincode"].toString().length !== 6){
			session.send("The pin number you have entered in incorrect. It should be exactly `six` digits long.");
		}else{
			session.userData.medicinePincode = message["pincode"];				
		}
			medicineCard = new builder.HeroCard(session)
									.title("Order Medicine")
									.subtitle("I still need your prescription to process the order")
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/oCmpQ56.png')
											.alt('Health Check Packages')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/medicines/467117a029f0e511aa80002219349965/"+session.userData.medicinePincode+"/?c="+session.userData.medicineCity, "Upload Prescription")
										]);
		session.send(new builder.Message(session)
			.addAttachment(medicineCard));
		
}



// Dialog to Book Consultation
bot.dialog('consultation',[
	function (session){
		session.beginDialog('askforconsultationCity');
	},
	function(sesison, results){	
		session.endDialogWithResult(results);		
	}
])
.triggerAction({
	matches: [/consultation/i, /consult/i, /doctor/i, /appointment/i],
	confirmPrompt: "⚠️ This will cancel your current request. Are you sure? (yes/no)"
	
});


// Dialog to ask for Consultation city
bot.dialog('askforconsultationCity',[
	function (session){
		//Make POST request to MA Server
		
			if(session.message && session.message.value){
				processSubmitAction3(session, session.message.value);
				session.endConversation();
				session.beginDialog('askforMore');
				return;
			}

			if(session.message.address.channelId === 'facebook'){
				session.beginDialog('displayconsultationFB');
				return;
			}
				var card = 
				{
				  "contentType": "application/vnd.microsoft.card.adaptive",
				 "content": {
					 
					"type": "AdaptiveCard",
					 "body": [
						{
						  "type": "TextBlock",
						  "text": "Select Filters: Book Consultation",
						  "weight": "bolder",
						  "size": "medium"
						},
						{
						  "type": "TextBlock",
						  "text": "We are one step away. Please choose city and speciality to continue.",
						  "wrap": true,
						  "maxLines": 4
						},
						{
						  "type": "TextBlock",
						  "text": "Choose your City"
						},
						{
						  "type": "Input.ChoiceSet",
						  "id": "city",
						  "style":"compact",
						  "choices": [
							{
							  "title": "Bengaluru",
							  "value": "Bengaluru",
							  "isSelected": true
							},
							{
								"title": "Chennai",
								"value": "Chennai"
							},
							{
								"title": "Delhi",
								"value": "Delhi"
							},
							{
								"title": "Hyderabad",
								"value": "Hyderabad"
							},
							{
								"title": "Kolkata",
								"value": "Kolkata"
							},
							{
								"title": "Mumbai",
								"value": "Mumbai"
							},
							{
								"title": "Pune",
								"value": "Pune"
							},
							{
								"title": "Ahmedabad",
								"value": "Ahmedabad"
							},
							{
								"title": "Bhubaneswar",
								"value": "Bhubaneswar"
							},
							{
								"title": "Cochin",
								"value": "Cochin"
							},
							{
								"title": "Coimbatore",
								"value": "Coimbatore"
							},
							{
								"title": "Ernakulam",
								"value": "Ernakulam"
							},
							{
								"title": "Faridabad",
								"value": "Faridabad"
							},
							{
								"title": "Ghaziabad",
								"value": "Ghaziabad"
							},
							{
								"title": "Gurgaon",
								"value": "Gurgaon"
							},
							{
								"title": "Hosur",
								"value": "Hosur"
							},
							{
								"title": "Kanpur",
								"value": "Kanpur"
							},
							{
								"title": "Kottayam",
								"value": "Kottayam"
							},
							{
								"title": "Lucknow",
								"value": "Lucknow"
							},
							{
								"title": "Mysuru",
								"value": "Mysuru"
							},
							{
								"title": "Navi Mumbai",
								"value": "Navi Mumbai"
							},
							{
								"title": "Noida",
								"value": "Noida"
							},
							{
								"title": "Patiala",
								"value": "Patiala"
							},
							{
								"title": "Patna",
								"value": "Patna"
							},
							{
								"title": "Secunderabad",
								"value": "Secunderabad"
							},
							{
								"title": "Thane",
								"value": "Thane"
							},
							{
								"title": "Thiruvananthapuram",
								"value": "Thiruvananthapuram"
							},
							{
								"title": "Thodupuzha",
								"value": "Thodupuzha"
							},
							{
								"title": "Trichy",
								"value": "Trichy"
							},
							{
								"title": "Vijayawada",
								"value": "Vijayawada"
							},
							{
								"title": "Visakhapatnam",
								"value": "Visakhapatnam"
							}
							
						  ]
						},
						{
						  "type": "TextBlock",
						  "text": "Select your Speciality"
						},{
						  "type": "Input.ChoiceSet",
						  "id": "speciality",
						  "style":"compact",
						  "choices": [
							{
							  "title": "Cardiologist",
							  "value": "Cardiologist"
							},
							{
								"title": "Gynaecologist",
								"value": "Gynaecologist"
							},
							{
								"title": "Nephrologist",
								"value": "Nephrologist"
							},
							{
								"title": "Gastroenterologist",
								"value": "Gastroenterologist"
							},
							{
								"title": "Ophthalmologist",
								"value": "Ophthalmologist"
							},
							{
								"title": "ENT",
								"value": "ENT"
							},
							{
								"title": "Dermatologist",
								"value": "Dermatologist"
							},
							{
								"title": "Dentist",
								"value": "Dentist"
							},
							{
								"title": "General Physician",
								"value": "General Physician",
							  "isSelected": true
							},
							{
								"title": "Neurologist",
								"value": "Neurologist"
							},
							{
								"title": "Paediatrician",
								"value": "Paediatrician"
							},
							{
								"title": "Orthopaedician",
								"value": "Orthopaedician"
							}
						  ]
						}
					  ],
					  "actions": [
					  {
							"type": "Action.Submit",
							"title": "Search"
					  }
					  ]
				 }
				};
				session.send(new builder.Message(session)
					.addAttachment(card));
			
		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

function processSubmitAction3(session, message){
		if(session.message.address.channelId === 'facebook'){
			session.beginDialog('displayconsultationFB');
			return;
		}	
		session.userData.consultationCity = message["city"];
			session.userData.consultationSpeciality = message["speciality"];				
			consultationCard = new builder.HeroCard(session)
									.title("Consultation")
									.subtitle("I've curated a list of "+message["speciality"]+"s in "+message["city"]+". Click below to know more")
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/E8kTRGq.png')
											.alt('Consultations')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/consultation/ad131e35ffb9e51184af002219349965//"+session.userData.consultationSpeciality+"/?c="+session.userData.consultationCity, "View Consultations")
										]);
		session.send(new builder.Message(session)
			.addAttachment(consultationCard));
		
}



// Dialog to Book Home Health Care
bot.dialog('homehealthcare',[
	function (session){
		session.beginDialog('askforhomehealthcareCity');
	},
	function(sesison, results){	
		session.endDialogWithResult(results);		
	}
])
.triggerAction({
	matches: [/home health care/i, /home care/i, /home health/i, /^Home Health Care$/gi],
	confirmPrompt: "⚠️ This will cancel your current request. Are you sure? (yes/no)"
	
});


// Dialog to ask for Consultation city
bot.dialog('askforhomehealthcareCity',[
	function (session){
		//Make POST request to MA Server
		
			if(session.message && session.message.value){
				processSubmitAction4(session, session.message.value);
				session.endConversation();
				session.beginDialog('askforMore');
				return;
			}

			if(session.message.address.channelId === 'facebook'){
				session.beginDialog('displayhomehealthcareFB');
				return;
			}
				var card = 
				{
				  "contentType": "application/vnd.microsoft.card.adaptive",
				 "content": {
					 
					"type": "AdaptiveCard",
					 "body": [
						{
						  "type": "TextBlock",
						  "text": "Select Filters: Home Health Care",
						  "weight": "bolder",
						  "size": "medium"
						},
						{
						  "type": "TextBlock",
						  "text": "We are one step away. Please choose city and service to continue.",
						  "wrap": true,
						  "maxLines": 4
						},
						{
						  "type": "TextBlock",
						  "text": "Choose your City"
						},
						{
						  "type": "Input.ChoiceSet",
						  "id": "city",
						  "style":"compact",
						  "choices": [
							{
							  "title": "Bengaluru",
							  "value": "Bengaluru",
							  "isSelected": true
							},
							{
								"title": "Chennai",
								"value": "Chennai"
							},
							{
								"title": "Delhi",
								"value": "Delhi"
							},
							{
								"title": "Hyderabad",
								"value": "Hyderabad"
							},
							{
								"title": "Kolkata",
								"value": "Kolkata"
							},
							{
								"title": "Mumbai",
								"value": "Mumbai"
							},
							{
								"title": "Pune",
								"value": "Pune"
							},
							{
								"title": "Ahmedabad",
								"value": "Ahmedabad"
							},
							{
								"title": "Baroda",
								"value": "Baroda"
							},
							{
								"title": "Chandigarh",
								"value": "Chandigarh"
							},
							{
								"title": "Gurgaon",
								"value": "Gurgaon"
							}
							
						  ]
						},
						{
						  "type": "TextBlock",
						  "text": "Select your Service"
						},{
						  "type": "Input.ChoiceSet",
						  "id": "service",
						  "style":"compact",
						  "choices": [
							{
							  "title": "Physiotherapist Visit",
							  "value": "Physiotherapist Visit"
							},
							{
								"title": "Attendant Visit",
								"value": "Attendant Visit"
							},
							{
								"title": "Nursing Visit",
								"value": "Nursing Visit",
								"isSelected": true
							}
						  ]
						}
					  ],
					  "actions": [
					  {
							"type": "Action.Submit",
							"title": "Search"
					  }
					  ]
				 }
				};
				session.send(new builder.Message(session)
					.addAttachment(card));
			
		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

function processSubmitAction4(session, message){
		if(session.message.address.channelId === 'facebook'){
			session.beginDialog('displayhomehealthcareFB');
			return;
		}	
		session.userData.homehealthcareCity = message["city"];
			session.userData.homehealthcareService = message["service"];				
			homehealthcareCard = new builder.HeroCard(session)
									.title("Home Health Care")
									.subtitle("Click below to view available home health care services in "+message["city"]+" for "+message["service"])
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/NOVSZ7T.png')
											.alt('Home Health Care')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/homehealthcare/ba678c34a85141299c0b43ac3b1ee8ca//"+session.userData.homehealthcareService+"/?c="+session.userData.homehealthcareCity, "View Services")
										]);
		session.send(new builder.Message(session)
			.addAttachment(homehealthcareCard));
		
}

// Dialog to Book Tele Consultation
bot.dialog('teleconsultation',[
	function (session){
		session.beginDialog('askforTeleConsultationDetails');
	},
	function(sesison, results){	
		session.endDialogWithResult(results);		
	}
])
.triggerAction({
	matches: [/telephone consultation/i, /telephonic consultation/i, /teleconsultation/i, /tele consultation/i, /tele-consultation/i, /^Tele Consultation$/gi],
	confirmPrompt: "⚠️ This will cancel your current request. Are you sure? (yes/no)"
	
});


// Dialog to ask for Tele Consultation Details
bot.dialog('askforTeleConsultationDetails',[
	function (session){
		
			if(session.message && session.message.value){
				processSubmitAction5(session, session.message.value);
				session.endConversation();
				session.beginDialog('askforMore');
				return;
			}
			if(session.message.address.channelId === 'facebook'){
				session.beginDialog('displayteleconsultationFB');
				return;
			}
				var card = 
				{
				  "contentType": "application/vnd.microsoft.card.adaptive",
				 "content": {
					 
					"type": "AdaptiveCard",
					 "body": [
						{
						  "type": "TextBlock",
						  "text": "Select Filters: Tele Consultation",
						  "weight": "bolder",
						  "size": "medium"
						},
						{
						  "type": "TextBlock",
						  "text": "We are one step away. Please select your preferred `speciality` to continue.",
						  "wrap": true,
						  "maxLines": 4
						},
						{
						  "type": "TextBlock",
						  "text": "Select your Service"
						},
						{
						  "type": "Input.ChoiceSet",
						  "id": "teleservice",
						  "style":"compact",
						  "choices": [
							{
							  "title": "Ayurveda",
							  "value": "Ayurveda"
							},
							{
								"title": "Cardiologist",
								"value": "Cardiologist"
							},
							{
								"title": "Dentist",
								"value": "Dentist",
								"isSelected": true
							},
							{
								"title": "Dermatologist",
								"value": "Dermatologist"
							},
							{
								"title": "Dietitian/Nutritionist",
								"value": "Dietitian/Nutritionist"
							},
							{
								"title": "Endocrinologist",
								"value": "Endocrinologist"
							},
							{
								"title": "ENT",
								"value": "ENT"
							},
							{
								"title": "General Physician",
								"value": "General Physician"
							},
							{
								"title": "Homoeopath",
								"value": "Homoeopath"
							},
							{
								"title": "Naturopath",
								"value": "Naturopath"
							},
							{
								"title": "Nephrologist",
								"value": "Nephrologist"
							},
							{
								"title": "Neurologist",
								"value": "Neurologist"
							},
							{
								"title": "Obstetrician/Gyneacologist",
								"value": "Obstetrician/Gyneacologist"
							},
							{
								"title": "Ophthalmologist",
								"value": "Ophthalmologist"
							},
							{
								"title": "Orthopedician",
								"value": "Orthopedician"
							},
							{
								"title": "Paediatrician",
								"value": "Paediatrician"
							},
							{
								"title": "Physiotherapist",
								"value": "Physiotherapist"
							},
							{
								"title": "Rheumatologist",
								"value": "Rheumatologist"
							},
							{
								"title": "Sexologist",
								"value": "Sexologist"
							},
							{
								"title": "Sports Medicine",
								"value": "Sports Medicine"
							}
						  ]
						}
					  ],
					  "actions": [
					  {
							"type": "Action.Submit",
							"title": "Search"
					  }
					  ]
				 }
				};
				session.send(new builder.Message(session)
					.addAttachment(card));
			
		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

function processSubmitAction5(session, message){
			if(session.message.address.channelId === 'facebook'){
				session.beginDialog('displayteleconsultationFB');
				return;
			}	
			session.userData.teleconsultationService = message["teleservice"];				
			teleconsultCard = new builder.HeroCard(session)
									.title("Tele Consultation")
									.subtitle("Click below to view available telephonic consultations for "+message["teleservice"])
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/RpZGGSt.png')
											.alt('Tele Consultation')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/onlineservice/4f81d4702c8242009081cfde6301dd38//"+session.userData.teleconsultationService, "View Services")
										]);
		session.send(new builder.Message(session)
			.addAttachment(teleconsultCard));
		
}


// Dialog to Book Lab Test
bot.dialog('labtest',[
	function (session){
		session.beginDialog('askforLabTestDetails');
	},
	function (session, results) {
		session.endConversation();
	},
	function(sesison, results){	
		session.endDialogWithResult(results);		
	}
])
.triggerAction({
	matches: [/lab test/i, /^Lab Test$/gi, /Laboratory/i, /Lab/i],
	confirmPrompt: "⚠️ This will cancel your current request. Are you sure? (yes/no)"
	
});


// Dialog to ask for Lab Test Details
bot.dialog('askforLabTestDetails',[
	function (session){
		//Make POST request to MA Server
		
			if(session.message && session.message.value){
				processSubmitAction6(session, session.message.value);
				session.endConversation();
				session.beginDialog('askforMore');
				return;
			}
			if(session.message.address.channelId === 'facebook'){
				session.beginDialog('displaylabtestFB');
				return;
			}
				var card = 
				{
				  "contentType": "application/vnd.microsoft.card.adaptive",
				 "content": {
					 
					"type": "AdaptiveCard",
					 "body": [
						{
						  "type": "TextBlock",
						  "text": "Select Filters: Lab Test",
						  "weight": "bolder",
						  "size": "medium"
						},
						{
						  "type": "TextBlock",
						  "text": "We are one step away. Please choose city and type of test to continue.",
						  "wrap": true,
						  "maxLines": 4
						},
						{
						  "type": "TextBlock",
						  "text": "Choose your City"
						},
						{
						  "type": "Input.ChoiceSet",
						  "id": "city",
						  "style":"compact",
						  "choices": [
							{
							  "title": "Bengaluru",
							  "value": "Bengaluru",
							  "isSelected": true
							},
							{
								"title": "Chennai",
								"value": "Chennai"
							},
							{
								"title": "Delhi",
								"value": "Delhi"
							},
							{
								"title": "Hyderabad",
								"value": "Hyderabad"
							},
							{
								"title": "Kolkata",
								"value": "Kolkata"
							},
							{
								"title": "Mumbai",
								"value": "Mumbai"
							},
							{
								"title": "Pune",
								"value": "Pune"
							},
							{
								"title": "Agra",
								"value": "Agra"
							},
							{
								"title": "Ahmedabad",
								"value": "Ahmedabad"
							},
							{
								"title": "Allahabad",
								"value": "Allahabad"
							},
							{
								"title": "Ambala",
								"value": "Ambala"
							},
							{
								"title": "Amritsar",
								"value": "Amritsar"
							},
							{
								"title": "Bareilly",
								"value": "Bareilly"
							},
							{
								"title": "Bhubaneswar",
								"value": "Bhubaneswar"
							},
							{
								"title": "Chandigarh",
								"value": "Chandigarh"
							},
							{
								"title": "Coimbatore",
								"value": "Coimbatore"
							},
							{
								"title": "Dehradun",
								"value": "Dehradun"
							},
							{
								"title": "Faridabad",
								"value": "Faridabad"
							},
							{
								"title": "Ghaziabad",
								"value": "Ghaziabad"
							},
							{
								"title": "Gurgaon",
								"value": "Gurgaon"
							},
							{
								"title": "Guwahati",
								"value": "Guwahati"
							},
							{
								"title": "Gwalior",
								"value": "Gwalior"
							},
							{
								"title": "Jaipur",
								"value": "Jaipur"
							},
							{
								"title": "Jalandhar",
								"value": "Jalandhar"
							},
							{
								"title": "Lucknow",
								"value": "Lucknow"
							},
							{
								"title": "Ludhiana",
								"value": "Ludhiana"
							},
							{
								"title": "Meerut",
								"value": "Meerut"
							},
							{
								"title": "Mohali",
								"value": "Mohali"
							},
							{
								"title": "Moradabad",
								"value": "Moradabad"
							},
							{
								"title": "Mysuru",
								"value": "Mysuru"
							},
							{
								"title": "Navi Mumbai",
								"value": "Navi Mumbai"
							},
							{
								"title": "Noida",
								"value": "Noida"
							},
							{
								"title": "Panchkula",
								"value": "Panchkula"
							},
							{
								"title": "Patna",
								"value": "Patna"
							},
							{
								"title": "Thane",
								"value": "Thane"
							},
							{
								"title": "Varanasi",
								"value": "Varanasi"
							}
							
						  ]
						},
						{
						  "type": "TextBlock",
						  "text": "Select your Test"
						},
						{
						  "type": "Input.ChoiceSet",
						  "id": "labtest",
						  "style":"compact",
						  "choices": [
							{
							  "title": "T3",
							  "value": "T3",
								"isSelected": true
							},
							{
								"title": "T4",
								"value": "T4"
							},
							{
								"title": "HBA1C",
								"value": "HBA1C"
							},
							{
								"title": "Liver Function Test",
								"value": "Liver Function Test"
							},
							{
								"title": "CBC",
								"value": "CBC"
							},
							{
								"title": "Lipid Profile",
								"value": "Lipid Profile"
							},
							{
								"title": "Platelet Count",
								"value": "Platelet Count"
							},
							{
								"title": "ESR",
								"value": "ESR"
							},
							{
								"title": "Thyroid Stimulating Hormone - TSH",
								"value": "Thyroid Stimulating Hormone - TSH"
							},
							{
								"title": "Vitamin B12",
								"value": "Vitamin B12"
							}
						  ]
						}
					  ],
					  "actions": [
					  {
							"type": "Action.Submit",
							"title": "Search"
					  }
					  ]
				 }
				};
				session.send(new builder.Message(session)
					.addAttachment(card));
			
		
	},
	function(session, results) {
		session.endDialogWithResult(results);
	}
]);

function processSubmitAction6(session, message){
		if(session.message.address.channelId === 'facebook'){
			session.beginDialog('displaylabtestFB');
			return;
		}
		session.userData.labtestCity = message["city"];
			session.userData.labtest = message["labtest"];	
			labtestCard = new builder.HeroCard(session)
									.title("Lab Test")
									.subtitle("Click below to view `"+message["labtest"]+"` tests in `"+message["city"]+"`")
									.text("https://infiniti.medibuddy.in")
									.images([
										new builder.CardImage(session)
											.url('https://i.imgur.com/Y3DtlFx.png')
											.alt('Lab Test')
									])
									.buttons([
										builder.CardAction.openUrl(session, "https://infiniti.medibuddy.in/labtest/f4a83a18cec74f1786b8fd2b9aff4c0c//"+session.userData.labtest+"/?c="+session.userData.labtestCity, "View Lab Tests")
										]);
		session.send(new builder.Message(session)
			.addAttachment(labtestCard));
}



// Initialize with the strategies we want to use
/*var ba = new botauth.BotAuthenticator(server, bot, { baseUrl : "https://medibotmb.azurewebsites.net", secret : BOTAUTH_SECRET })
    .provider("facebook", (options) => { 
        return new FacebookStrategy({
            clientID : "1893719730892870",
            clientSecret : "98e0e4ebdbfd51b8691640b0fe2d574c",
            callbackURL : options.callbackURL
        }, (accessToken, refreshToken, profile, done) => {
            profile = profile || {};
            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            
            return done(null, profile);
        });
	});
	
	/**
 * Just a page to make sure the server is running
 */
/*
server.get("/facebook", (req, res) => {
    res.send("facebook");
});*/


//=========================================================
// Bot Dialogs
//=========================================================
/*
bot.dialog('facebook', new builder.IntentDialog({ recognizers : [ recog ]})
    .matches("SayHello", "hello")
    .matches("GetProfile", "/profile")
    .matches("Logout", "/logout")
    .onDefault((session, args) => {
        session.endDialog("I didn't understand that.  Try saying 'show my profile'.");
    })
);*/

/*
server.post('/fbloginbutton', (req, res, session) => {
    session.beginDialog('profile');
});*/
/*
const ncu = require('npm-check-updates');
 
ncu.run({
    // Always specify the path to the package file
    packageFile: 'package.json',
    // Any command-line option can be specified here.
    // These are set by default:
    silent: true,
    jsonUpgraded: true
}).then((upgraded) => {
    console.log('dependencies to upgrade:', upgraded);
});*/

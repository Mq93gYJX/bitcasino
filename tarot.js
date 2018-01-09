// tarot.js:  JavaScript Backend Tarot
const http=require('http'),
	https=require('https'),
	url=require('url'),
	crypto=require('crypto'),
	path=require('path');

const express=require('express'),
	cookieParser = require('cookie-parser');

var app=express();

var swords=[], wands=[], coins=[], cups=[];
for(var i=1;i<11;i++){
	swords.push(i+' of Swords');
	wands.push(i+' of Wands');
	coins.push(i+' of Coins');
	cups.push(i+' of Cups');
}
const courtCards=['King','Queen','Knight','Page'];
courtCards.forEach(function(card){
	swords.push(card+' of Swords');
	wands.push(card+' of Wands');
	coins.push(card+' of Coins');
	cups.push(card+' of Cups');
});

const minorArcana=[].concat(swords,wands,coins,cups);

const majorArcana=[
	'I. The Magician', 'II. The High Priestess', 'III. The Empress',
	'IV The Emperor', 'V. The Hierophant', 'VI. The Lovers',
	'VII. The Chariot', 'VIII. Strength', 'IX. The Hermit',
	'X. Wheel of Fortune', 'XI. Justice', 'XII. The Hanged Man',
	'XIII	Death', 'IXX	Temperance', 'XX	The Devil',
	'XXI	The Tower','XXII	The Star','The Moon',
	'The Sun','Judgement','The World','0 The Fool'
];

app.use(cookieParser('secret'));

app.use(function(req,res,next){
		var secret=req.secret;

		res.sync=function(req){
			req['session']['entropy']=crypto.randomBytes(8);

			const cipher=crypto.createCipher('aes256',Buffer(secret));
			let ciphertext='';
			ciphertext=cipher.update(
				JSON.stringify(req['session']),'utf8','base64');
			ciphertext+=cipher.final('base64');

			this.cookie('session',ciphertext,
				{signed:true,httpOnly:true});
		};

		req['session']=Object.create(null);

		if(typeof req.signedCookies['session']=='undefined' ||
				req.signedCookies['session']==null){
			return next();
		}

		const decipher=crypto.createDecipher('aes256',Buffer(secret));
		let cleartext='';
		cleartext=decipher.update(req.signedCookies['session'],'base64','utf8');
		cleartext+=decipher.final('utf8');
		req['session']=JSON.parse(cleartext);
		
		return next();
});

app.post('/vend',function(req,res){
	// transfer in credits

	// on success
	req['session'].deck=majorArcana.concat(minorArcana)
		.sort(function(){ return 0.5-Math.random(); });
	req['session'].drawn=[];
	res.sync(req);
	// STATUS_CODE[201]='Created';
	res.status(201).json({balance:req['session'].credits}).end();
	
	// STATUS_CODE[402]='Payment Required';
	// res.status(402).json({STATUS_CODE:http.STATUS_CODES[402]}).end();
});

app.get('/draw',function(req,res){
	if(req['session'].deck.length>0){
		var card=req['session'].deck.shift();
		req['session'].drawn.push(card);
		res.sync(req);
		res.status(201).json(card).end();
	} else {
		// STATUS_CODE[402]='Payment Required';
		delete req['session'].deck;
		delete req['session'].drawn;
		res.sync(req);
		res.status(402).json({STATUS_CODE:http.STATUS_CODES[402]}).end();
	}
});

app.listen(8080);


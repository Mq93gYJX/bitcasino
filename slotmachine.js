// slotmachine.js:  JavaScript Backend Slotmachine
const http=require('http'),
	https=require('https'),
	crypto=require('crypto'),
	url=require('url'),
	path=require('path');

const express=require('express'),
	cookieParser = require('cookie-parser');

var app=express();

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
	req['session'].credits=10;
	res.sync(req);
	// STATUS_CODE[201]='Created';
	res.status(201).json({balance:req['session'].credits}).end();
	
	// STATUS_CODE[402]='Payment Required';
	// res.status(402).json({STATUS_CODE:http.STATUS_CODES[402]}).end();
});

app.get('/play',function(req,res){
	if(req['session'].credits>0){
		req['session'].credits--;
		var slotA=[0,1,2,3,4,5,6,7,8,9],
			slotB=[1,2,3,4,5,6,7,8,9,0],
			slotC=[2,4,6,8,0,1,3,5,7,9],
			a=Math.random()*slotA.length+1|0,
			b=Math.random()*slotB.length+1|0,
			c=Math.random()*slotC.length+1|0;
		if(slotA[a]==slotB[b] && slotB[b]==slotC[c]){
			// winner
			req['session'].credits+=10;
		}
		res.sync(req);
		res.status(200)
			.json({spin:[a,b,c],balance:req['session'].credits})
			.end();
	}else{
		// STATUS_CODE[402]='Payment Required';
		res.status(402).json({STATUS_CODE:http.STATUS_CODES[402]}).end();
	}
});

app.post('/cashout',function(req,res){
	if(req['session']>0){
		// transfer session.credits out
	}
	req['session'].credits=0;
	res.sync(req);
	res.status(200).json({balance:req['session'].credits}).end();
});

app.listen(8080);

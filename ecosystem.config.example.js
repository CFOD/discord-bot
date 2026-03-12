module.exports = {
  apps : [{
	name   : "discord-bot",
	script : "./discord-bot.js",
	env: {
	  "NODE_ENV": "production",
	  "GEMINI_API_KEY": "your_gemini_api_key_here",
	  "MAPBOX_TOKEN": "your_mapbox_token_here"
	}
  }]
}

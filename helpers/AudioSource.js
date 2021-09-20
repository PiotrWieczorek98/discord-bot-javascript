class AudioSourceLocal {
	constructor(path, title) {
		this.path = path,
		this.title = title;
	}
}

class AudioSourceYoutube {
	constructor(id, title, url) {
		this.id = id,
		this.title = title,
		this.url = url;
	}
}

module.exports.AudioSourceLocal = AudioSourceLocal;
module.exports.AudioSourceYoutube = AudioSourceYoutube;

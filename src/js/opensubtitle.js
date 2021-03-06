var packaged_app = (window.location.origin.indexOf("chrome-extension") == 0);
var host = "http://api.opensubtitles.org/xml-rpc";
if (!packaged_app) {
    if (window.location.origin.indexOf("localhost") == 0)
	host = "http://localhost:8080/xml-rpc";
    else
	host = window.location.origin + "/xml-rpc";
}

function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 1024;

    function charCodeFromCharacter(c) {
        return c.charCodeAt(0);
    }

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);
        var byteNumbers = Array.prototype.map.call(slice, charCodeFromCharacter);
        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

var openSubsLang = [
    ["alb", "Albanian"],
    ["ara", "Arabic"],
    ["baq", "Basque"],
    ["pob", "Brazilian"],
    ["bul", "Bulgarian"],
    ["cat", "Catalan"],
    ["chi", "Chinese"],
    ["cze", "Czech"],
    ["dan", "Danish"],
    ["dut", "Dutch"],
    ["eng", "English"],
    ["est", "Estonian"],
    ["fin", "Finnish"],
    ["fre", "French"],
    ["geo", "Georgian"],
    ["ger", "German"],
    ["glg", "Galician"],
    ["ell", "Greek"],
    ["heb", "Hebrew"],
    ["hin", "Hindi"],
    ["hrv", "Croatian"],
    ["hun", "Hungarian"],
    ["ice", "Icelandic"],
    ["ind", "Indonesian"],
    ["ita", "Italian"],
    ["jpn", "Japanese"],
    ["khm", "Khmer"],
    ["kor", "Korean"],
    ["mac", "Macedonian"],
    ["may", "Malay"],
    ["nor", "Norwegian"],
    ["oci", "Occitan"],
    ["per", "Persian"],
    ["pol", "Polish"],
    ["por", "Portuguese"],
    ["rum", "Romanian"],
    ["rus", "Russian"],
    ["scc", "Serbian"],
    ["sin", "Sinhalese"],
    ["slo", "Slovak"],
    ["slv", "Slovenian"],
    ["spa", "Spanish"],
    ["swe", "Swedish"],
    ["tgl", "Tagalog"],
    ["tha", "Thai"],
    ["tur", "Turkish"],
    ["ukr", "Ukrainian"],
    ["vie", "Vietnamese"]
];

(function($) {
    $.extend(MediaElementPlayer.prototype, {
	buildopensubtitle: function(player, controls, layers, media) {
	    var 
	    t = this;

	    var service = new rpc.ServiceProxy(host, {
		sanitize: false,
		protocol: "XML-RPC",
		asynchronous: true,
		methods: ["ServerInfo", "LogIn", "SearchSubtitles", "DownloadSubtitles", "TryUploadSubtitles", "CheckMovieHash", "SearchMoviesOnIMDB", "UploadSubtitles"]
	    });
	    t.opensubtitleService = {
		token:null, service:service, lastSubtitles : [],
		username: "",
		pwd: ""
	    };
	    
	    var prec = $('#li_encoding');
	    var line1 =
		$('<li class="mejs-captionload"/>')
		.append($('<input type="radio" name="' + player.id + '_captions" id="' + player.id + '_captions_opensubtitle" value="opensubtitle" disabled="disabled"/>'))
		.append($('<div id="opensubtitle_button" class="mejs-button  mejs-captionload" > <button type="button" aria-controls="' + t.id + '" title="' + mejs.i18n.t('Download subtitles from OpenSubtitles.org') + '" aria-label="' + mejs.i18n.t('Download subtitles from OpenSubtitles.org') + '"></button></div>'))
	    	.append($('<select id="select_opensubtitle_lang" style="padding: 0px 0px 0px 0px;text-overflow: ellipsis;width: 105px;height: 18px;overflow: hidden;white-space: nowrap;left:60px;position:absolute"/>'));
	    line1.insertBefore(prec)

	    var selectLang = $('#select_opensubtitle_lang')[0];
	    openSubsLang.forEach(function (e) {
		$('<option value="'+e[0]+'">'+e[1]+'</option>').appendTo(selectLang);
	    });


	    var line2 =
		$('<li class="mejs-captionload"/>')
		.append($('<div class="mejs-button  mejs-captionload"/>'))
		.append($('<select id="select_opensubtitle" style="padding: 0px 0px 0px 0px;text-overflow: ellipsis;width: 105px;height: 18px;overflow: hidden;white-space: nowrap;left:60px;position:absolute;visibility:hidden"/>'))
		.append($('<label id="label_opensubtitle" style="padding: 0px 0px 0px 0px;text-overflow: ellipsis;width: 105px;height: 18px;overflow: hidden;white-space: nowrap;left:60px;position:absolute;">No subtitle</label>'))
		.insertAfter(line1);

	    $('#select_opensubtitle_lang').val("eng");


	    player.controls.find
	    ('input[id="'+player.id + '_captions_opensubtitle"]').click(function() {
		lang = this.value;
		player.setTrack(lang);
	    });

	    $('<div><div class="opensubtitleBanner" style="width: 100%;color: white; background: rgba(20, 20, 20, 0.8); text-align:center; font-size: 16px; padding-top:20px; padding-bottom:20px; z-index:999; position:absolute; cursor: pointer;visibility:hidden;">Click here (or press [d]) to download subtitles from OpenSubtitles.org</div></div>')
		.appendTo(layers);
	    player.opensubtitleBanner = $('.opensubtitleBanner');


	    function info(text) {
		$('#label_opensubtitle')[0].textContent=text;
	    };
	    function infoBanner(text) {
		player.opensubtitleBanner[0].textContent=text;
	    };
	    function infoBoth(text) {
		info(text);
		infoBanner(text);
	    };

	    function openSubtitle(content, sub) {
		infoBoth("5/6 Opening...");
		var blob = b64toBlob(content, "text/plain");
		zip.createGZipReader(new zip.BlobReader(blob),function(reader) {
		    reader.gunzip(new zip.BlobWriter(), function(data){
			info(sub.SubFileName);

			infoBanner(sub.SubFileName + ' downloaded');
			t.subtitleBannerTimer = setTimeout(function() {
			    player.opensubtitleBanner.css('visibility','hidden');
			    clearTimeout(t.subtitleBannerTimer);
			    delete t.subtitleBannerTimer;
			    t.subtitleBannerTimer = null;
			}, 2000);


			if (t.opensubtitleService.lastSubtitles.length > 1) {
			    $('#select_opensubtitle').css('visibility','inherit');
			    $('#label_opensubtitle').css('visibility','hidden');
			}
			

			$('#encoding-selector').val("UTF-8");

			t.tracks = t.tracks.filter(function (el) {
			    return el.srclang != 'opensubtitle';
			});
			t.tracks.push({
			    srclang: 'opensubtitle',
			    file: data,
			    kind: 'subtitles',
			    label: 'OpenSubtitle',
			    entries: [],
			    isLoaded: false
			});

			var trackIdx = t.findTrackIdx("opensubtitle")
			t.tracks[trackIdx].file = data;
			t.tracks[trackIdx].isLoaded = false;
			t.loadTrack(trackIdx);
		    }, 
				  function(data){
				      console.log(data);
				  },
				  function(data){
				      console.log(data);
				  },
				  function(data){
				      console.log(data);
				  })
		});
	    }

	    function downloadSubtitle(sub) {
		infoBoth("4/6 Downloading...");
		service.DownloadSubtitles({
		    params: [t.opensubtitleService.token, [
			sub.IDSubtitleFile
		    ]],
		    onException:function(errorObj){
			infoBoth("Download failed...");
		    },
		    onComplete:function(responseObj){
			var content = responseObj.result.data[0].data;
			openSubtitle(content, sub);
		    }
		});
	    }

	    function searchSubtitle(hash) {
		var lang = "eng";
		lang = $('#select_opensubtitle_lang')[0].value;
		// var lang = "ell";
		infoBoth("3/6 Searching...");
		service.SearchSubtitles({
		    params: [t.opensubtitleService.token, [
			{query: t.openedFile.name,
			 sublanguageid: lang},
			{moviehash: hash,
			 moviebytesize: t.openedFile.size,
			 sublanguageid: lang}
		    ], {limit:100}],
		    onException:function(errorObj){
			infoBoth("Search failed");
		    },
		    onComplete:function(responseObj){
			console.log(responseObj);
			// Check that at leat a subtitle has been found
			$('#select_opensubtitle')
				.find('option')
				.remove()
				.end();
			var subtitles = responseObj.result.data;
			for (var i=0; i<subtitles.length; i++) {
			    $('#select_opensubtitle')
				.append('<option value="'+
					i+'">'+
					subtitles[i].SubFileName+
					'</option>');
			}
			$('#select_opensubtitle').val(0);
			t.opensubtitleService.lastSubtitles = subtitles;

			$('#select_opensubtitle').off( "change");
			$('#select_opensubtitle').change(function(e) {
			    $('#label_opensubtitle').css('visibility','inherit');
			    $('#select_opensubtitle').css('visibility','hidden');
			    downloadSubtitle(
				subtitles[Number($('#select_opensubtitle')[0].value)]
			    );
			});

			downloadSubtitle(subtitles[0]);
		    }
		});
	    };

	    function movieHash() {
		infoBoth("2/6 Hashing...");
		OpenSubtitlesHash(t.openedFile, function(hash){
		    searchSubtitle(hash);
		});
	    };

	    function logIn() {
		$(document).trigger("opensubtitlesDownload"); 

		infoBoth("1/6 Authenticating...");
		service.LogIn({
		    params: [t.opensubtitleService.username, t.opensubtitleService.pwd, "", "ChromeSubtitleVideoplayer"],
		    onException:function(errorObj){
			infoBoth("Authentiation failed");
		    },
		    onComplete:function(responseObj){
			t.opensubtitleService.token = responseObj.result.token;
			movieHash();
		    }
		});
	    };

	    player.openSubtitleLogIn = logIn;

	    player.opensubtitleBanner.click(function(e) {
		e.preventDefault();
		e.stopPropagation();
		logIn();
		return false;
	    });

	    $('#opensubtitle_button').click(function (e) {
		$('#label_opensubtitle').css('visibility','inherit');
		$('#select_opensubtitle').css('visibility','hidden');
		t.subtitleBannerTimer = setTimeout(function() {
		    clearTimeout(t.subtitleBannerTimer);
		    delete t.subtitleBannerTimer;
		    t.subtitleBannerTimer = null;
		}, 10000);

		logIn();
	    });

	    // on load a new video
	    media.addEventListener('loadeddata',function() {
		t.captionsButton
		    .find('input[value=opensubtitle]')
		    .prop('disabled',true);
		info("No subtitle");
		infoBanner("Click here (or press [d]) to download subtitles from OpenSubtitles.org");
		$('#label_opensubtitle').css('visibility','inherit');
		$('#select_opensubtitle').css('visibility','hidden');
		t.opensubtitleService.lastSubtitles = [];
		var defaultValue = selectDefault.value;
		$('#select_opensubtitle_lang').val(defaultValue);

		player.opensubtitleBanner.css('visibility','inherit');

		t.subtitleBannerTimer = setTimeout(function() {
		    player.opensubtitleBanner.css('visibility','hidden');
		    clearTimeout(t.subtitleBannerTimer);
		    delete t.subtitleBannerTimer;
		    t.subtitleBannerTimer = null;
		}, 10000);
	    });


	    var settingsList = $('#settings_list')[0];
	    $('<li/>')
    		.appendTo(settingsList)
    		.append($('<label style="width:250px; float:left;">Default opensubtitle.org language</label>'))
    		.append($('<select id="defaultOpenSubtitleLang" style="width:100px"/>'));
	    var selectDefault = $('#defaultOpenSubtitleLang')[0];

	    $('<li/>')
    		.appendTo(settingsList)
    		.append($('<label style="width:250px; float:left;">Opensubtitls.org username</label>'))
    		.append($('<input id="usernameOpenSubtitle" style="width:100px;background-color: transparent; color: white;"/>'));
	    $('#usernameOpenSubtitle').keydown(function (e) {
		e.stopPropagation();
		return true;
	    });

	    $('<li/>')
    		.appendTo(settingsList)
    		.append($('<label style="width:250px; float:left;">Opensubtitls.org password</label>'))
    		.append($('<input id="pwdOpenSubtitle" type="password" style="width:100px;background-color: transparent; color: white;"/>'));
	    $('#pwdOpenSubtitle').keydown(function (e) {
		e.stopPropagation();
		return true;
	    });

	    openSubsLang.forEach(function (e) {
		$('<option value="'+e[0]+'">'+e[1]+'</option>').appendTo(selectDefault);
	    });

	    getFromSettings(
		'default_opensubtitle_lang',
		"eng",
		function (value) {
		    $(selectDefault).val(value);
		    $('#select_opensubtitle_lang').val(value);
		}
	    );
	    getFromSettings(
		'opensubtitle_username',
		"",
		function (value) {
		    t.opensubtitleService.username = value;
		    $("#usernameOpenSubtitle")[0].value = value
		}
	    );
	    getFromSettings(
		'opensubtitle_pwd',
		"",
		function (value) {
		    t.opensubtitleService.pwd = value;
		    $("#pwdOpenSubtitle")[0].value = value
		}
	    );

	    $(document).bind("settingsClosed", function() { 
		var defaultValue = selectDefault.value;
		$('#select_opensubtitle_lang').val(defaultValue);
		setIntoSettings(
		    'default_opensubtitle_lang',
		    defaultValue,
		    function () {}
		);

		t.opensubtitleService.username =
		    $("#usernameOpenSubtitle")[0].value;
		setIntoSettings(
		    'opensubtitle_username',
		    t.opensubtitleService.username,
		    function () {}
		);

		t.opensubtitleService.pwd =
		    $("#pwdOpenSubtitle")[0].value;
		setIntoSettings(
		    'opensubtitle_pwd',
		    t.opensubtitleService.pwd,
		    function () {}
		);
	    });
	    
	}
    });
})(mejs.$);


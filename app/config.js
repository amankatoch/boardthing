// This is the runtime configuration file.  It complements the Gruntfile.js by
// supplementing shared properties.
require.config({
	paths: {
		"almond": "/libs/almond",
		"underscore": "/libs/lodash.underscore",
		"jquery": "/libs/jquery",
		"jqueryUI": "/libs/jquery-ui.min",
    	"touchpunch": "/libs/jquery.ui.touch-punch.min",
    	"cookies": "/libs/jquery.cookie",
		"backbone": "/libs/backbone",
		"uiwidget": "/libs/file_upload/jquery.ui.widget",
		"fileupload": "/libs/file_upload/jquery.fileupload",
		"loadimage": "/libs/file_upload/load-image",
		"loadimageexif": "/libs/file_upload/load-image-exif",
		"loadimageios": "/libs/file_upload/load-image-ios",
		"loadimagemeta": "/libs/file_upload/load-image-meta",
		"canvastoblob": "/libs/file_upload/canvas-to-blob.min",
		"iframetransport": "/libs/file_upload/jquery.iframe-transport",
		"fileuploadprocess": "/libs/file_upload/jquery.fileupload-process",
		"fileuploadimage": "/libs/file_upload/jquery.fileupload-image",
    	"spectrum": "/libs/spectrum"
	},
	shim: {
		"jqueryUI": {
			deps: ["jquery"],
			exports: "jqueryUI"
		},
	    'touchpunch': {
	        deps: ['jquery', 'jqueryUI' ],
	        exports: 'touchpunch'
	    },
	    "cookie": {
	        deps: ["jquery"],
	        exports: "cookies"
	    },
		'uiwidget': {
		    deps: ['jquery'],
		    exports: 'uiwidget'
		},
		'fileupload': {
		    deps: ['jquery','uiwidget'],
		    exports: 'fileupload'
		},
		'loadimage': {
		    deps: ['jquery'],
		    exports: 'loadimage'
		},
		'canvastoblob': {
		    deps: ['jquery'],
		    exports: 'canvastoblob'
		},
		'iframetransport': {
		    deps: ['jquery'],
		    exports: 'iframetransport'
		},
		'fileuploadprocess': {
		    deps: ['jquery'],
		    exports: 'fileuploadprocess'
		},
		'fileuploadimage': {
		    deps: ['jquery','loadimage','loadimagemeta','loadimageexif','loadimageios','canvastoblob','fileuploadprocess'],
		    exports: 'fileuploadimage'
		},
		'loadimageexif': {
		    deps: ['jquery'],
		    exports: 'loadimageexif'
		},
		'loadimageios': {
		    deps: ['jquery'],
		    exports: 'loadimageios'
		},
		'loadimagemeta': {
		    deps: ['jquery'],
		    exports: 'loadimagemeta'
		},
	    'spectrum': {
	        deps: ['jquery'],
	        exports: 'spectrum'
	    }
	}
});

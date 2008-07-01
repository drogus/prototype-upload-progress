/*
 * prototype.uploadProgress
 *
 * Copyright (c) 2008 Peter Sarnacki (drogomir.com)
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */
var UploadProgressMethods = {
	uploadProgress: function(element, options) {
		/* tried to add iframe after submit (to not always load it) but it won't work. 
		safari can't get scripts properly while submitting files */
		if(Prototype.Browser.WebKit && top.document == document) {
		
			/* iframe to send ajax requests in safari 
			thanks to Michele Finotto for idea */
			iframe = document.createElement('iframe');
			iframe.name = "progressFrame";
			$(iframe).setStyle({width: '0', height: '0', position: 'absolute', top: '-3000px'});
			document.body.appendChild(iframe);
			
			var d = iframe.contentWindow.document;
			d.open();
			/* weird - safari won't load scripts without this lines... */
			d.write('<html><head></head><body></body></html>');
			d.close();
			
			var b = d.body;
			var s = d.createElement('script');
			s.src = options.prototypePath;
			/* must be sure that jquery is loaded */
			s.onload = function() {
				var s1 = d.createElement('script');
				s1.src = options.uploadProgressPath;
				b.appendChild(s1);
			}
			b.appendChild(s);
		}
	
		Event.observe(element, 'submit', function() {
			var uuid = "";
			for (i = 0; i < 32; i++) { uuid += Math.floor(Math.random() * 16).toString(16); }	
			
			options == options || {};
			options = Object.extend({
				interval: 2000,
				progressBar: "progressbar",
				progressUrl: "/progress",
				start: function() {},
				uploading: function() {},
				complete: function() {},
				success: function() {},
				error: function() {},
				uploadProgressPath: '/javascripts/prototype.js',
				prototypePath: '/javascripts/prototype.uploadProgress.js',
                                timer: ""
			}, options);
			
			options.uuid = uuid;
			/* start callback */
			options.start();
			
			/* patch the form-action tag to include the progress-id 
                           if X-Progress-ID has been already added just replace it */
                        if(old_id = /X-Progress-ID=([^&]+)/.exec($(this).readAttribute("action"))) {
                          var action = $(this).readAttribute("action").replace(old_id[1], uuid);
                          $(this).writeAttribute("action", action);
                        } else {
			  $(this).writeAttribute("action", $(this).readAttribute("action") + "?X-Progress-ID=" + uuid);
			}
			var uploadProgress = Prototype.Browser.WebKit ? progressFrame.Prototype.uploadProgress : Prototype.uploadProgress;
			options.timer = window.setInterval(function() { uploadProgress(this, options) }, options.interval);
		});
	}
};

Element.addMethods(UploadProgressMethods);

PrototypeUploadProgressMethods = {
	uploadProgress: function(element, options) {
		new Ajax.Request(options.progressUrl, {
			method: 'get',
			parameters: 'X-Progress-ID='+ options.uuid,
			onSuccess: function(xhr){
				var upload = xhr.responseText.evalJSON();
				upload.percents = Math.floor((upload.received / upload.size)*100);
				if (upload.state == 'uploading') {
					var bar = Prototype.Browser.WebKit ? parent.document.getElementById(options.progressBar) : $(options.progressBar);
              				bar.setStyle({width: Math.floor(upload.percents) + '%'});
					options.uploading(upload);
				}
				/* we are done, stop the interval */
				if (upload.state == 'done' || upload.state == 'error') {
					window.clearTimeout(options.timer);
					options.complete(upload);
				}
				
				if (upload.state == 'done') {
					options.success(upload);
				}
				
				if (upload.state == 'error') {
					options.error(upload);
				}
			}
		});
	}
};

Object.extend(Prototype, PrototypeUploadProgressMethods);
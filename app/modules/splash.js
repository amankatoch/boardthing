define([
	"modules/user.services",
	"jquery"
],
	
function(User_Services) {
	var Splash = {};

	// ===== View when you first come to BoardThing

	Splash.Index = Backbone.View.extend({
    	el: "<div>",

    	// {{ Contructor }}

		initialize: function() {
			this.el.id = "splash-container";

			this.render();
      	},

		// {{ Object Building }}

		render: function(){
			var that = this;

			$.get("/app/templates/home/splash.html", function(contents) {
				that.$el.html(_.template(contents));

				that.unbind();
				that.bind();
			}, "text");
		},

		// {{ Event Binding }}

		unbind: function() {
			this.$("#signup-button").unbind("click");
			this.$("#login-button").unbind("click");
		},

		bind: function() {
			this.$("#signup-button").click(function(e) {
  				Backbone.history.navigate("signup", true);
			});

			this.$("#login-button").click(function(e) {
				Backbone.history.navigate("login", true);
			});
		}
	});

	return Splash;
});
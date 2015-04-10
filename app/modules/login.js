define([
	"modules/user.services",
	"jquery"
],
	
function(User_Services) {
	var Login = {};

	// ===== View allowing user login to BoardThing

	Login.Index = Backbone.View.extend({
    	el: "<div>",

    	// {{ Contructor }}

		initialize: function() {
			this.el.id = "splash-container";

			this.render();
      	},

		// {{ Object Building }}

		render: function(){
			var that = this;

			$.get("/app/templates/home/login.html", function(contents) {
				that.$el.html(_.template(contents));

				that.unbind();
				that.bind();
			}, "text");
		},

		// {{ Event Binding }}
      	
		unbind: function() {
			this.$("#splash-logo").unbind("click");
			this.$("#signup-button").unbind("click");
			this.$("#login-button").unbind("click");
			this.$("#create-account-link").unbind("click");
			this.$("#log-in-button").unbind("click");
		},

		bind: function() {
			var that = this;

			this.$("#splash-logo").click(function(e) {
  				Backbone.history.navigate("", true);
			});

			this.$("#signup-button").click(function(e) {
  				Backbone.history.navigate("signup", true);
			});

			this.$("#login-button").click(function(e) {
				Backbone.history.navigate("login", true);
			});

			this.$("#create-account-link").click(function(e) {
  				Backbone.history.navigate("signup", true);
			});

			this.$("#log-in-button").click(function(e) {
				that.loginUser();
			});
		},

		// {{ Public Methods }}

		loginUser: function() {
			var that = this;

			var email = this.$("#email").val();
			var password = this.$("#password").val();

			if (((email) && (email.trim().toLowerCase().length > 0)) && 
				((password) && (password.trim().toLowerCase().length > 0))) {
				User_Services.Athenticate(email, password, function(response) {
					if (response.code == 200) {
						Backbone.history.navigate("/main", true);
					}
					else {
						that.$("#password").val("");
						that.$("#login-error-message").html(response.message);
					}
				});
			}
			else {
				if (((!email) || (email.trim().toLowerCase().length == 0)) && ((!password) || (password.trim().toLowerCase().length == 0))) {
					this.$("#login-error-message").html("E-mail and password required");
				}
				else if ((!email) || (email.trim().toLowerCase().length == 0)) {
					this.$("#login-error-message").html("E-mail required");
				}
				else if ((!password) || (password.trim().toLowerCase().length == 0)) {
					this.$("#login-error-message").html("Password required");
				}
			}
		}
	});

	return Login;
});
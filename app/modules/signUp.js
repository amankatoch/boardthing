define([
	"modules/user.services",
	"jquery"
],
	
function(User_Services) {
	var SignUp = {};

	// ===== View allowing user sign up to BoardThing

	SignUp.Index = Backbone.View.extend({
    	el: "<div>",
    	id: "splash-container",

    	// {{ Contructor }}

		initialize: function() {
			this.el.id = "splash-container";

			this.render();
      	},

		// {{ Object Building }}

		render: function(){
			var that = this;

			$.get("/app/templates/home/signUp.html", function(contents) {
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
			this.$("#create-account-button").unbind("click");
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

			this.$("#create-account-button").click(function(e) {
				that.createAcount();
			});
		},

		// {{ Public Methods }}

		createAcount: function() {
			var that = this;

			var username = this.$("#username").val();
			var email = this.$("#email").val();
			var password = this.$("#password").val();
			var passwordConfirm = this.$("#password-confirm").val();

			if (((username) && (username.trim().toLowerCase().length > 0)) && 
				((email) && (email.trim().toLowerCase().length > 0)) && 
				((password) && (password.trim().toLowerCase().length > 0))) {
				if (password == passwordConfirm) {
					var emailFilter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
		
					if (emailFilter.test(email)) {
						User_Services.Insert(username, email, password, function(response) {
							if (response.code == 200) {
								User_Services.Athenticate(email, password, function(loginResponse) {
									if (loginResponse.code == 200) {
										Backbone.history.navigate("/main", true);
									}
									else {
										that.$("#password").val("");
										that.$("#password-confirm").val("");
										that.$("#login-error-message").html(loginResponse.message);
									}
								});
							}
							else {
								that.$("#password").val("");
								that.$("#password-confirm").val("");
								that.$("#signup-error-message").html(response.message);
							}
						});
					}
					else {
						this.$("#password").val("");
						this.$("#password-confirm").val("");
						this.$("#signup-error-message").html("Invalid e-mail");
					}
				}
				else {
					this.$("#password").val("");
					this.$("#password-confirm").val("");
					this.$("#signup-error-message").html("Passwords much match");
				}
			}
			else {
				if (((!username) || (username.trim().toLowerCase().length == 0)) && ((!password) || 
					(!email) || (email.trim().toLowerCase().length == 0)) && 
					((!password) || (password.trim().toLowerCase().length == 0))) {
					this.$("#signup-error-message").html("Username, e-mail and password required");
				}
				if (((!email) || (email.trim().toLowerCase().length == 0)) && ((!password) ||
					(password.trim().toLowerCase().length == 0))) {
					this.$("#signup-error-message").html("E-mail and password required");
				}
				else if ((!email) || (email.trim().toLowerCase().length == 0)) {
					this.$("#signup-error-message").html("E-mail required");
				}
				else if ((!password) || (password.trim().toLowerCase().length == 0)) {
					this.$("#signup-error-message").html("Password required");
				}
			}
		}
	});

	return SignUp;
});
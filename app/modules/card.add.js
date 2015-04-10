define([
	"modules/card.services",
	"modules/cluster.services",
	"uiwidget",
    'fileupload',
    "loadimage",
    "canvastoblob",
    "iframetransport",
    "fileuploadprocess",
    "fileuploadimage",
	"jquery",
    'jqueryUI',
    'touchpunch',
	"spectrum"
],

function(Card_Services, Cluster_Services) {
	var AddCard = {};

	AddCard.Text = Backbone.View.extend({
    	el: "<div>",

    	_cardModel: null,
    	_selectedColor: null,

    	_isMobile: null,
    	_workspace: null,

		initialize: function(options) {
    		this.el.id = "card-create-container";
			this.el.className = "card-input-container";

    		this._isMobile = options.isMobile;
    		this._workspace = options.workspace;
		},

		render: function() {
			var that = this;

			var template = "/app/templates/card/addCard.html";
			if (this._isMobile) template = "/app/templates/card/addCard.mobile.html";

			$.get(template, function(contents) {
				that.$el.html(_.template(contents, {
					card: that.model
				}));

				that.afterRender();				

				that.unbind();
				that.bind();
			}, "text");
		},

		afterRender: function() {
			var that = this;

	    	this.$("#add-card-color-select, #edit-card-color-select, #upload-card-color-select, #link-card-color-select, #edit-image-card-color-select").spectrum("destroy");

	    	var selectedCardColor = "#ffffff";

	    	if (this._cardModel) {
	    		selectedCardColor = this._cardModel.color;
	    		this._selectedColor = null;
	    	}
	    	else {
	    		if (this._selectedColor) selectedCardColor = this._selectedColor;
	    	}

			that.$el.css({ "background-color": selectedCardColor });
			that.$(".popup-active-item").css({ "background-color": selectedCardColor });

	    	this.$("#add-card-color-select, #edit-card-color-select, #upload-card-color-select, #link-card-color-select, #edit-image-card-color-select").spectrum({
			    color: selectedCardColor,
			    showInput: true,
			    className: "card-color-spectrum",
			    showInitial: true,
			    showPaletteOnly: true,
			    showPalette:true,
			    maxPaletteSize: 10,
			    preferredFormat: "hex",
			    localStorageKey: "spectrum.boardthing.card",
			    palette: ["rgb(255,255,153)", "rgb(255,255,0)", "rgb(255,204,102)", "rgb(255,153,0)", "rgb(255,102,255)", "rgb(255,0,204)", "rgb(204,153,255)", "rgb(153,153,255)", "rgb(102,255,255)", "rgb(51,204,255)", "rgb(153,255,102)", "rgb(102,255,0)", "rgb(255,255,255)", "rgb(204,204,204)", "rgb(255,0,51)"],
			    change: function(color) {
			    	that._selectedColor = color.toHexString();

					that.$el.css({ "background-color": that._selectedColor });
					that.$(".popup-active-item").css({ "background-color": that._selectedColor });
					
					that.$("#add-card-color-select, #edit-card-color-select, #upload-card-color-select, #link-card-color-select, #edit-card-color-select").spectrum("set", that._selectedColor);
				}
			});

			if (this._cardModel) {
				if (this._cardModel.type == "text") {
					$("#current-card-text").focus();

					this.$("#current-card-text").val(this._cardModel.content);

					$("#edit-text-container").show();
				}
				else {
					this.$("#current-content-image").attr("src", "/workspace/boards/cards/image/" + that._workspace.getId() + "/" + that._cardModel.boardId + "/" + that._cardModel.id + "?random=" + new Date().getTime());

					this.$("#edit-image-title").val(this._cardModel.title);

					$("#edit-image-container").show();
				}
			}
			else {			
				this.$('#imageUpload').fileupload({ 	
			        dataType: 'json',
	    			disableImageResize: false,
				    imageMaxWidth: 1000,
				    imageMaxHeight: 1000,
				    imageCrop: false,
				    autoUpload: false,
			        add: function (e, data) {
			        	that._cardsAdded = true;

			            data.context = that.$("#upload-image-button").click(function () {
							that.$('#imageUpload').fileupload({ url: "/workspace/boards/cards/image/" + that._workspace.getId() + "/" + that._workspace.getDropBoardId() });

							that.$('#progress').show();

	                    	data.submit();
		                });

		            	that.$("#selected-files-container").show();

			            for (var i=0; i < data.files.length; i++) {
			            	that.$("#selected-files-container").append("<div class=\"file-to-upload\">" + data.files[i].name + "</div>");
			            }
			        },
			        done: function (e, data) {
			        	var addedImage = data.result.card;
						addedImage.boardId = that._workspace.getDropBoardId();
			        	addedImage.title = that.$("#photo-upload-title").val();
			        	addedImage.color = that.$("#upload-card-color-select").spectrum("get").toString();

			        	imageValues = {
				        	title: that.$("#photo-upload-title").val(),
							color: that.$("#upload-card-color-select").spectrum("get").toString()
				        };

				        $.ajax({
				            url: "/workspace/boards/cards/image/" + that._workspace.getId() + "/" + addedImage.boardId + "/" + addedImage.id,
				            type: 'PUT',
				            dataType: "json",
				            data: imageValues
			        	});

						that._workspace.cardAdded(addedImage);

				    	that.$("#card-color-select").spectrum("hide");

						that._workspace.hideAddCard();
			        },
			        progressall: function (e, data) {
			            var progress = parseInt(data.loaded / data.total * 100, 10);
			            $('#progress .progress-bar').css(
			                'width',
			                progress + '%'
			            );
			        }
			    });

				$("#add-text-container").show();

				$("#card-text").focus();
			}
		},

		unbind: function() {
			this.$el.unbind("click");

			this.$("#cancel-card").unbind("click");
			this.$("#post-card, #update-text-card, #update-image-card").unbind("click");

			this.$("#add-image-button").unbind("click");
			this.$("back-image-button").unbind("click");
			
			this.$("#card-text").unbind("click");
			this.$("#add-image-btn").unbind("click");

			this.$(".show-add-text-btn").unbind("click");
			this.$(".show-add-image-btn").unbind("click");

			this.$("#link-to-photo-header").unbind("click");
			this.$("#upload-photo-header").unbind("click");
		},

		bind: function() {
			var that = this;

  			this.$el.click(function(e) {
				e.stopPropagation();
  			});

			this.$("#cancel-card").click(function(e) {
				e.stopPropagation();
				
				that._workspace.hideAddCard();
			});

			this.$("#post-card, #update-text-card, #update-image-card").click(function(e) {
				e.stopPropagation();
				
				that.saveTextCard();
			});

			this.$("#add-image-button").click(function(event) {
				event.stopPropagation();

				that.addImageFromURL();
			});

			this.$("#back-image-button").click(function(event) {
				event.stopPropagation();

				that.showLinkPhoto();
			});

			this.$("#card-text, #current-card-text").keypress(function(e) {
			  	var charCode = e.charCode || e.keyCode;

		        if ((e) && (!e.shiftKey) && (charCode == 13)) {
		        	e.preventDefault();

		        	that.saveTextCard();
		        }
			});

			this.$(".show-add-text-btn").click(function(e) {
				e.stopPropagation();

				that.showAddText();
			});

			this.$(".show-add-image-btn").click(function(e) {
				e.stopPropagation();

				that.showAddImage();
			});

			this.$("#link-to-photo-header").click(function(event) {
				event.stopPropagation();
				
				that.showLinkPhoto();
			});

			this.$("#upload-photo-header").click(function(event) {
				event.stopPropagation();
				
				that.showUploadPhoto();
			});
		},

		showAddText: function() {
			this.$("#add-text-container").show();
			this.$("#add-image-container").hide();
    		this.$("#add-linked-error-body").hide();
		},
		
		showAddImage: function() {
			this.$("#add-text-container").hide();
			this.$("#add-image-container").show();
    		this.$("#add-linked-error-body").hide();
		},

        showLinkPhoto: function() {
    		this.$("#add-upload-image-body").hide();
    		this.$("#add-linked-image-body").show();
    		this.$("#add-linked-error-body").hide();

			this.$(".popup-active-item").css({ "background-color": "" });
			this.$("#link-to-photo-header").css({ "background-color": this.$("#card-color-select").spectrum("get").toString() });
    		this.$("#link-to-photo-header").removeClass('popup-inactive-item').removeClass('popup-active-item').addClass('popup-active-item');
    		this.$("#upload-photo-header").removeClass('popup-inactive-item').removeClass('popup-active-item').addClass('popup-inactive-item');
        },

        showUploadPhoto: function() {
    		this.$("#add-upload-image-body").show();
    		this.$("#add-linked-image-body").hide();
    		this.$("#add-linked-error-body").hide();

			this.$(".popup-active-item").css({ "background-color": "" });
			this.$("#upload-photo-header").css({ "background-color": this.$("#card-color-select").spectrum("get").toString() });
    		this.$("#link-to-photo-header").removeClass('popup-inactive-item').removeClass('popup-active-item').addClass('popup-inactive-item');
    		this.$("#upload-photo-header").removeClass('popup-inactive-item').removeClass('popup-active-item').addClass('popup-active-item');
        },

		saveTextCard: function(e) {
			var that = this;

			if (!this._cardModel) {
				if (this.$("#card-text").val().trim().length > 0) {
					var boardId = this._workspace.getDropBoardId();

					var newCard = {
						type: "text",
						boardId: boardId,
						content: this.$("#card-text").val(),
						color: this.$("#add-card-color-select").spectrum("get").toString()
					};
					
					Card_Services.InsertTextCard(this._workspace.getId(), boardId, newCard, function(response) {
						var addedCard = response.card;
						addedCard.boardId = boardId;

						that._workspace.cardAdded(addedCard);

						that._workspace.sendSocket(JSON.stringify({ 
							action:"boardCardAdded", 
							workspace: that._workspace.getId(), 
							card: addedCard
						}));
					});
				}
			}
			else {
				var updateModel = null;

				if ((this._cardModel.cards == null)|| (this._cardModel.cards.length === 0)) {
					if (this._cardModel.type == "text") {
						if (this.$("#current-card-text").val().trim().length > 0) {
							var updateModel = {
								id: this._cardModel.id,
								parentId: this._cardModel.parentId,
								content: this.$("#current-card-text").val(),
								color: this.$("#edit-card-color-select").spectrum("get").toString()
							};

							Card_Services.UpdateTextCard(this._workspace.getId(), this._cardModel.boardId, this._cardModel.id, updateModel, function(response) {
								that._workspace.sendSocket(JSON.stringify({ 
									action:"boardCardUpdated", 
									workspace: that._workspace.getId(),
									card: updateModel 
								}));
							});
						}
					}
					else {
						if (this.$("#edit-image-title").val().trim().length > 0) {
							var updateModel = {
								id: this._cardModel.id,
								parentId: this._cardModel.parentId,
								title: this.$("#edit-image-title").val(),
								color: this.$("#edit-image-card-color-select").spectrum("get").toString()
							};

							Card_Services.UpdateImageCard(this._workspace.getId(), this._cardModel.boardId, this._cardModel.id, updateModel, function(response) {
								that._workspace.sendSocket(JSON.stringify({ 
									action:"boardCardUpdated", 
									workspace: that._workspace.getId(),
									card: updateModel 
								}));
							});
						}
					}
				}
				else {
					updateModel = {
						id: this._cardModel.id, 
						type: "text",
						boardId: this._cardModel.boardId,
		  				action: "update",
						color: this.$("#card-color-select").spectrum("get").toString()
		  			};

		  			if (this._cardModel.type == "text") updateModel.content = this.$("#card-text").val();
		  			else updateModel.title = this.$("#card-text").val();

					Cluster_Services.Insert(this._workspace.getId(), this._cardModel.boardId, this._cardModel.id, updateModel, function(response) {
						that._workspace.sendSocket(JSON.stringify({ 
							action:"boardClusterUpdated", 
							workspace: that._workspace.getId(),
							cluster: updateModel 
						}));
					});
				}
				
				that._workspace.cardEdited(updateModel);
			}

	    	this.$("#card-color-select").spectrum("hide");

			this._workspace.hideAddCard();

			this.$el.empty();
			this.render();
		},

        addImageFromURL: function(){
			var urlValid = true,
		        that = this,
		        boardId = this._workspace.getDropBoardId();

			if (this.$("#photo-url-location").val().trim().length == 0) {
				this.$("#photo-url-location").css("border", "1px solid #ff0000");
				urlValid = false;
			}
			else this.$("#photo-url-location").css("border", "1px solid #b9b9b9");

			if (urlValid) {
				this.$("#loading-container").show();
				this.$("#photo-url-title").prop('disabled', true);
				this.$("#photo-url-location").prop('disabled', true);
				this.$("#photo-upload-title").prop('disabled', true);
				this.$("#add-image-button").prop('disabled', true);
				this.$("#upload-image-button").prop('disabled', true);

				var imageLocation = this.$("#photo-url-location").val();

		        imageValues = {
		        	title: this.$("#photo-url-title").val(),
					color: this.$("#link-card-color-select").spectrum("get").toString(),
		            imageLocation: imageLocation
		        };

		        $.ajax({
		            url: "/workspace/boards/cards/downloadImage/" + this._workspace.getId() + "/" + boardId,
		            type: 'POST',
		            dataType: "json",
		            data: imageValues,
		            success: function(response) {
			        	if (response.code == 200) {
							var addedCard = response.card;
							addedCard.boardId = boardId;

							that._workspace.cardAdded(addedCard);

							that._workspace.sendSocket(JSON.stringify({ 
								action:"boardCardAdded", 
								workspace: that._workspace.getId(), 
								card: addedCard
							}));

							that._workspace.hideAddCard();

							that.$el.empty();
							that.render();
			        	}
			        	else {
							that.$("#loading-container").hide();
							that.$("#photo-url-title").prop('disabled', false);
							that.$("#photo-url-location").prop('disabled', false);
							that.$("#photo-upload-title").prop('disabled', false);
							that.$("#add-image-button").prop('disabled', false);
							that.$("#upload-image-button").prop('disabled', false);

			        		that.$("#add-linked-image-body").hide();
			        		that.$("#add-linked-error-body").show();
			        		that.$("#back-image-error").html("The image you selected could not be uploaded");
			        	}
		            }
	        	});
			}
        },

        hide: function() {
			this._cardModel = null;
        },

		showAddText: function() {
			this._cardModel = null;

			this.$el.empty();
			this.render();
		},

		showEdit: function(cardModel) {
			this._cardModel = cardModel;

			this.$el.empty();
			this.render();
		}
	});

	return AddCard;
});
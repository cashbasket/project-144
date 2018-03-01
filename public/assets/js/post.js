$.urlParam = function(name, url) {
	if (!url) {
		url = window.location.href;
	}
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
	if (!results) { 
		return undefined;
	}
	return results[1] || undefined;
};
	
$(function() {
	var options = $('#album option');
	var arr = options.map(function(_, o) { return { t: $(o).text(), v: o.value }; }).get();
	arr.sort(function(o1, o2) {  
		var t1 = o1.t.toLowerCase(), t2 = o2.t.toLowerCase();
		return t1 > t2 ? 1 : t1 < t2 ? -1 : 0; });
	options.each(function(i, o) {
		o.value = arr[i].v;
		$(o).text(arr[i].t);
	});

	$.widget( 'custom.combobox', {
		_create: function() {
			this.wrapper = $( '<span>' )
				.addClass( 'custom-combobox' )
				.insertAfter( this.element );

			this.element.hide();
			this._createAutocomplete();
			this._createShowAllButton();
		},

		_createAutocomplete: function() {
			var selected = this.element.children( ':selected' ),
				value = selected.val() ? selected.text() : '';

			this.input = $( '<input>' )
				.appendTo( this.wrapper )
				.val( value )
				.attr( 'title', '' )
				.addClass( 'custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left' )
				.autocomplete({
					delay: 0,
					minLength: 0,
					source: $.proxy( this, '_source' )
				})
				.tooltip({
					classes: {
						'ui-tooltip': 'ui-state-highlight'
					}
				});

			this._on( this.input, {
				autocompleteselect: function( event, ui ) {
					ui.item.option.selected = true;
					this._trigger( 'select', event, {
						item: ui.item.option
					});
				},

				autocompletechange: '_removeIfInvalid'
			});
		},

		_createShowAllButton: function() {
			var input = this.input,
				wasOpen = false;

			$( '<a>' )
				.attr( 'tabIndex', -1 )
				.attr( 'title', 'Show All Items' )
				.tooltip()
				.appendTo( this.wrapper )
				.button({
					icons: {
						primary: 'ui-icon-triangle-1-s'
					},
					text: false
				})
				.removeClass( 'ui-corner-all' )
				.addClass( 'custom-combobox-toggle ui-corner-right' )
				.on( 'mousedown', function() {
					wasOpen = input.autocomplete( 'widget' ).is( ':visible' );
				})
				.on( 'click', function() {
					input.trigger( 'focus' );

					// Close if already visible
					if ( wasOpen ) {
						return;
					}

					// Pass empty string as value to search for, displaying all results
					input.autocomplete( 'search', '' );
				});
		},

		_source: function( request, response ) {
			var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), 'i' );
			response( this.element.children( 'option' ).map(function() {
				var text = $( this ).text();
				if ( this.value && ( !request.term || matcher.test(text) ) )
					return {
						label: text,
						value: text,
						option: this
					};
			}) );
		},

		_removeIfInvalid: function( event, ui ) {

			// Selected an item, nothing to do
			if ( ui.item ) {
				return;
			}

			// Search for a match (case-insensitive)
			var value = this.input.val(),
				valueLowerCase = value.toLowerCase(),
				valid = false;
			this.element.children( 'option' ).each(function() {
				if ( $( this ).text().toLowerCase() === valueLowerCase ) {
					this.selected = valid = true;
					return false;
				}
			});

			// Found a match, nothing to do
			if ( valid ) {
				return;
			}

			// Remove invalid value
			this.input
				.val( '' )
				.attr( 'title', value + ' didn\'t match any item' )
				.tooltip( 'open' );
			this.element.val( '' );
			this._delay(function() {
				this.input.tooltip( 'close' ).attr( 'title', '' );
			}, 2500 );
			this.input.autocomplete( 'instance' ).term = '';
		},

		_destroy: function() {
			this.wrapper.remove();
			this.element.show();
		}
	});

	$( '#album' ).combobox();
	$('.ui-combobox-input').val($('#select option:selected').text()); 

	$('img.gravatar-img').each(function(i, el) {
		var imgUrl = $(el).attr('src');
		$.ajax({
			url: imgUrl,
			type: 'HEAD',
			crossDomain:true,
			error: function(){
				$(el).attr('src', '/assets/img/silhouette.jpg');
			}
		});
	});

	if($.urlParam('albumId')) {
		$('#album > option').each(function() {
			if($(this).attr('value') === $.urlParam('albumId')) {
				$(this).attr('selected', 'selected');
			}
		});
		$('.custom-combobox-input').val($('#album option:selected').text()); 
	}

	if($('#postBody').length) {
		var editor = new Quill('#postBody', {
			modules: {
				toolbar: [
					['bold', 'italic'],
					['link', 'blockquote']
				]
			},
			placeholder: 'e.g. This particular album is the best or worst album ever recorded, period. Or not.',
			theme: 'snow'
		});

		if($.urlParam('postId')) {
			$('.ql-editor').html($('#content').val());
		}

		const maxRsvpChars = 1000;
		editor.on('text-change', function () {
			if (editor.getLength() > maxRsvpChars) {
				editor.deleteText(maxRsvpChars, editor.getLength());
			}
			$('#charsLeft').text(maxRsvpChars - editor.getLength() + 1);
			if(editor.getLength() > 900) {
				$('#charsLeft').addClass('red');
			} else {
				$('#charsLeft').removeClass('red');
			}
		});
	}

	$('#postForm').on('submit', function(event) {
		event.preventDefault();
		var errors = [];
		var userId = $('#userId').val();
		var postId = $('#postId').val();
		var albumId = $('#album').val();
		var status = $('#status').val() === 'public' ? true : false;
		var postBody = $('.ql-editor').html();
		$('.errors').addClass('d-none');

		if (!albumId) {
			errors.push('You must choose an album to write about.');
		}

		if($('.ql-editor').html() === '<p><br></p>') {
			errors.push('You must actually write something.');
		} 
		
		if(errors) {
			var errorIntro = $('<p>').text('The following errors occurred:');
			var errorList = $('<ul>');
			for (var i = 0; i < errors.length; i++) {
				var errorItem = $('<li>').text(errors[i]);
				errorList.append(errorItem);
			}
			$('.errors').append(errorIntro)
				.append(errorList);
			$('.errors').removeClass('d-none');
			window.scrollTo(0, 0);
			return false;
		} else {
			if(!$.urlParam('postId')) {
				$.ajax('/api/post/' + userId + '/' + albumId, {
					type: 'POST',
					data: { 
						body: postBody,
						isPublic: status
					}
				}).then(function(data) {
					console.log(data);
					$('#postForm').hide();
					$('#result').removeClass('d-none');
					$('#resultMsg').removeClass('d-none').text('Your post was created successfully!');
				});
			} else {
				if($('#deletePost').is(':checked')) {
					$.ajax('/api/post/' + userId + '/' + postId, {
						type: 'DELETE'
					}).then(function(data) {
						$('#postForm').hide();
						$('#result').removeClass('d-none');
						$('#resultMsg').text('Your post was deleted successfully. Goodbye, post!');
					});
				} else {
					$.ajax('/api/post/' + userId + '/' + postId, {
						type: 'PUT',
						data: { 
							body: postBody,
							isPublic: status
						}
					}).then(function(data) {
						$('#postForm').hide();
						$('#result').removeClass('d-none');
						$('#resultMsg').text('Your post was updated successfully.');
					});
				}
			}
		}
	});
});
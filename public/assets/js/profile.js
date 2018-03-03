function createCommentEditor(postId) {
	var commentEditor = new Quill('#commentBody-' + postId, {
		modules: {
			toolbar: false
		},
		placeholder: 'e.g. I value your opinion greatly.',
		theme: 'snow'
	});

	commentEditor.on('text-change', function() {
		var maxChars = 500;
		if (commentEditor.getLength() > maxChars) {
			commentEditor.deleteText(maxChars, commentEditor.getLength());
		}
	});
}

$(document).ready(function() {

	// display the comments section for the post
	$('.view-comments').on('click', function() {
		var id = $(this).data('id');
		$('#comments-' + id).toggleClass('d-none');
		createCommentEditor(id);
	});

	$('.comment-form').on('submit', function(event) {
		event.preventDefault();
		var postId = $(this).data('post-id');
		var commentBody = $('#commentBody-' + postId + ' > .ql-editor').html();
		$('#commentStatus-' + postId).addClass('d-none');
		if(!commentBody.html() === '<p><br><p>')
			$('#commentStatus-' + postId).removeClass('d-none').text('You need to enter a comment first.');
		
		$.ajax('/api/comment/' + postId, {
			type: 'POST',
			data: { 
				body: commentBody
			}
		}).then(function(data) {
			commentBody.html('<p><br><p>');
			$('#commentStatus-' + postId).removeClass('d-none').text('Posted!');
			// TODO: append new comment to bottom of comments list
		});
	});

	$('#collectionQuery').on('keyup', function(event){
		event.preventDefault();
		$.ajax('/api/user/' + $('.profile-title').text() + '/search', {
			type: 'POST',
			data: { 
				query: $('#collectionQuery').val().trim()
			}
		}).then(function(data) {
			if(data) {
				$('#collection').empty();
				var albumHtml = '';
				for(var i = 0; i < data.user.Albums.length; i++) {
					var album = data.user.Albums[i];
					var artistsDisplay = '';
					for(var j = 0; j < album.Artists.length; j++) {
						artistsDisplay += album.Artists[j].artist_name;
						if (j < album.Artists.length - 1)
							artistsDisplay += ', ';
					}					
					// I hate this approach so much, but it's 1:30 in the morning and I can't think of a better way to do it right now.
					if(i === 0) {
						albumHtml += '<div class="row">';
					}
					albumHtml += '<div class="col-md-3">';
					albumHtml += '<div class="album-container">';
					albumHtml += '<img src="' + album.album_art + '" class="album-image img-fluid" />';
					albumHtml += '<div class="album-overlay">';
					albumHtml += '<div class="album-overlay-text">';
					albumHtml += data.extra.loggedIn ? '<a href="/album/' + album.id + '">' : '';
					albumHtml += '<h5 class="white">' + album.title + '</h5>';
					albumHtml += data.extra.loggedIn ? '</a>' : '';
					albumHtml += '<p>by ' + artistsDisplay + '</p>';
					albumHtml += data.extra.canEdit ? '<a href="/user/' + data.user.username + '/post/?albumId=' + album.id + '"><i class="fas fa-pencil-alt"></i> Write a Post</a>' : '';
					albumHtml += '</div>';
					albumHtml += '</div>';
					albumHtml += '</div>';
					albumHtml += '</div>';

					if (i === 3 || (i > 3 && i % 4 === 3) || i === data.user.Albums.length - 1) {
						albumHtml += '</div><br><div class="row">';
					}
				}
				$('#collection').html(albumHtml);
			}
		});
	});
});
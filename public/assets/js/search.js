$(document).ready(function() {
	$('.add-album').on('click', function(event){
		var userId = $(this).data('id');
		var albumId = $(this).data('album-id');
		$.ajax('/api/album/' + userId + '/' + albumId, {
			type: 'POST',
			data: { 
				AlbumId: albumId,
				UserId: userId
			}
		}).then(function(data) {
			$('#album-' + albumId)
				.fadeOut(500, function() {
					$('#album-' + albumId)
						.attr('href', '/user/' + data.username + '/post/?album=' + albumId)
						.html('<i class="fas fa-pencil-alt"></i> Write a Post')
						.fadeIn(500);
				});
		});
	});
});
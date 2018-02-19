$(document).ready(function() {
	if($('#type').val() === 'title') 
		$('#query').attr('placeholder', 'e.g. "Number of the Beast"');
	else
		$('#query').attr('placeholder', 'e.g. "Iron Maiden"');
	$('#type').on('change', function(event) {
		if ($(this).val() === 'title') {
			$('#searchTypeText').text('album title');
			$('#query').attr('placeholder', 'e.g. "Number of the Beast"');
		} else {
			$('#searchTypeText').text('artist name');
			$('#query').attr('placeholder', 'e.g. "Iron Maiden"');
		}
	});

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
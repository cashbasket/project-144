function addSpansToArray(spanClass) {
	var array = [];
	$('.' + spanClass).each(function() {
		array.push($(this).text());
	});
	return array;
}

$(document).ready(function() {
	$('#addButton').on('click', function(event) {
		var userId = $(this).data('id');
		var username = $(this).data('username');
		var albumId = $(this).data('master-id');
		var title = $('#title').text();
		
		var artists = addSpansToArray('artist'); // adds all artist names to the artists array
		var genres = addSpansToArray('genre'); // etc.
		var labels = addSpansToArray('label');
		var styles = addSpansToArray('style');
		var year = $('#year').text();
		var album_art = $(this).data('album-art');

		var albumData = {
			id: albumId,
			title: title,
			artists: artists,
			labels: labels,
			genres: genres,
			styles: styles,
			year: year,
			album_art: album_art,
			added_by: userId
		};

		$.ajax('/api/album/' + userId + '/' + albumId, {
			type: 'POST',
			data: albumData
		}).then(function(data) {
			$('#addButton')
				.fadeOut(200, function() {
					$('#addButton')
						.attr('href', '/user/' + username + '/post/?albumId=' + albumId)
						.html('<i class="fas fa-pencil-alt"></i> Write a Post')
						.fadeIn(200);
				});
		});
	});
});
	
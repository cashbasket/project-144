$(document).ready(function() {
	$('#addButton').on('click', function(event) {
		var userId = $(this).data('id');
		var username = $(this).data('username');
		var albumId = $(this).data('master-id');
		var title = $('#title').text();
		var artists = $('#artists').text().split(', ');
		var genres = $('#genres').text().split(', ');
		var labels = $('#labels').text().split(', ');
		var styles = $('#styles').text().split(', ');
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
			data: JSON.stringify(albumData),
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
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
	
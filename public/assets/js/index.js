$(document).ready(function() {$('img.gravatar-img').each(function(i, el) {
	// this will be used in a couple places (profile, user edit templates)
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

	$('#signupForm').on('submit', function(event) {
		$('.form-group').removeClass('has-danger');
		$('.form-control').removeClass('is-invalid');

		var email = $('#signupEmail').val().trim();
		var username = $('#signupUsername').val().trim();
		var password = $('#signupPassword').val().trim();
		var usernameRegex = /^(?=.{1,20}$)(?![_-])(?!.*[_.]{2})[a-zA-Z0-9_-]+(?<![_-])$/;
		var errors = false;

		if(!usernameRegex.test(username)) {
			$('#fgSignupUsername').addClass('has-danger');
			$('#signupUsername').addClass('is-invalid');
			$('#badSignupUsername').html('Username <em>must</em>: <ul>' + 
				'<li>contain only alphanumeric characters, underscores, and hyphens</li>' + 
				'<li>be no more than 20 characters in length</li>' +
				'<li>not begin or end with an underscore or hyphen</li>' + 
				'<li>not have more than one underscore or hyphen in a row</li>' +
			'</ul>');
			return false;
		}
		if (password.length < 8 || password.length > 16) {
			$('#fgSignupPassword').addClass('has-danger');
			$('#signupPassword').addClass('is-invalid');
			return false;
		} 

		return true;
	});

	/*$('#loginForm').on('submit', function(event) {
		event.preventDefault();
		$('.form-group').removeClass('has-danger');
		$('.form-control').removeClass('is-invalid');

		var email = $('#email').val().trim();
		var password = $('#password').val().trim();
		var data = {
			email: email,
			password: password
		};
		$.ajax('/login', {
			type: 'POST',
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			data: JSON.stringify(data)
		}).then(function(data) {
			console.log('what');
			if(!data) {
				$('#message').removeClass('d-none')
					.text(data.message);
			} else {
				location.href='/user/' + data.username;
			}
		});
	});*/
	
	$('#logout').on('click', function(event) {
		$.ajax('/logout', {
			type: 'GET'
		}).then(function(result) {
			location.href='/login';
		});
	});
});
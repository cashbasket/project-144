$(document).ready(function() {
	$('#signupForm').on('submit', function(event) {
		event.preventDefault();
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
			errors = true;
		}
		if (password.length < 8 || password.length > 16) {
			$('#fgSignupPassword').addClass('has-danger');
			$('#signupPassword').addClass('is-invalid');
			errors = true;
		} 

		if (!errors) {
			$.ajax('/api/user/register', {
				type: 'POST',
				data: { 
					email: email,
					username: username,
					password: password
				}
			}).then(function(data) {
				if (data.error) {
					if (data.error === 'username') {
						$('#fgSignupUsername').addClass('has-danger');
						$('#signupUsername').addClass('is-invalid');
						$('#badSignupUsername').text('That username is already taken');
					} else if (data.error === 'email') {
						$('#fgSignupEmail').addClass('has-danger');
						$('#signupEmail').addClass('is-invalid');
					}
				} else {
					location.href='/user/' + username;
				}
			});
		}
	});

	$('#loginForm').on('submit', function(event) {
		event.preventDefault();
		$('.form-group').removeClass('has-danger');
		$('.form-control').removeClass('is-invalid');

		var login = $('#loginUser').val().trim();
		var password = $('#loginPassword').val().trim();

		$.ajax('/login', {
			type: 'POST',
			data: { 
				login: login,
				password: password
			}
		}).then(function(data) {
			if (data.error) {
				if (data.error === 'no such user') {
					$('#fgLoginUser').addClass('has-danger');
					$('#loginUser').addClass('is-invalid');
				} else if (data.error === 'bad password') {
					$('#fgLoginPassword').addClass('has-danger');
					$('#loginPassword').addClass('is-invalid');
				}
			} else {
				location.href='/user/' + data.username;
			}
		});
	});
	
	$('#logout').on('click', function(event) {
		$.ajax('/logout', {
			type: 'POST'
		}).then(function(result) {
			location.href='/';
		});
	});
});
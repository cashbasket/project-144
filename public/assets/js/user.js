// Borrowed (with love) from http://locutus.io/php/strip_tags/
function strip_tags (input, allowed) { // eslint-disable-line camelcase
	// making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
	allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
  
	var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
	var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
  
	var before = input;
	var after = input;
	// recursively remove tags to ensure that the returned string doesn't contain forbidden tags after previous passes (e.g. '<<bait/>switch/>')
	while (true) {
		before = after;
		after = before.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
			return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
		});
  
		// return once no more tags are removed
		if (before === after) {
			return after;
		}
	}
}

$(document).ready(function() {
	$('#userEditForm').on('submit', function(event) {
		var errors = false;
		var email = $('#email').val().trim();
		var confirmEmail = $('#confirmEmail').val().trim();
		var currentPassword = $('#password').val().trim();
		var newPassword = $('#newPassword').val().trim();
		var confirmPassword = $('#confirmPassword').val().trim();
		var name = strip_tags($('#name').val().trim());
		var location = strip_tags($('#location').val().trim());
		var bio = strip_tags($('#bio').val().trim());

		$('.form-group').removeClass('has-danger');
		$('.form-control').removeClass('is-invalid');

		event.preventDefault();

		if (email != confirmEmail) {
			$('#fgConfirmEmail').addClass('has-danger');
			$('#confirmEmail').addClass('is-invalid');
			errors = true;
		}

		if (newPassword.length && !currentPassword.length) {
			$('#fgPassword').addClass('has-danger');
			$('#password').addClass('is-invalid');
			errors = true;
		}

		if (newPassword.length && currentPassword.length) {
			if (newPassword !== confirmPassword) {
				$('#fgConfirmPassword').addClass('has-danger');
				$('#confirmPassword').addClass('is-invalid');
				errors = true;
			}
			if (newPassword.length < 8 || newPassword.length > 16) {
				$('#fgNewPassword').addClass('has-danger');
				$('#newPassword').addClass('is-invalid');
				errors = true;
			} 
		}	
	
		if (!errors) {
			$.ajax('/api/user/' + $('#username').val() + '/edit', {
				type: 'PUT',
				data: { 
					email: email,
					currentPassword: currentPassword,
					newPassword: newPassword,
					name: name,
					location: location,
					bio: bio
				}
			}).then(function(data) {
				if (data.error) {
					if (data.error === 'email in use') {
						$('#fgEmail').addClass('has-danger');
						$('#email').addClass('is-invalid');
					}
					if (data.error === 'bad password') {
						$('#fgPassword').addClass('has-danger');
						$('#password').addClass('is-invalid');
					}
				} else {
					$('#updateSuccess').removeClass('d-none').fadeOut(3000, function() {
						$('#updateSuccess').addClass('d-none');
					});
					$('#password, #newPassword, #confirmPassword').val('');
					window.scrollTo(0, 0);
				}
			});
		}
	});
});
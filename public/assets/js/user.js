$(document).ready(function() {
	$('#userEditForm').on('submit', function(event) {
		var errors = false;
		var email = $('#email').val().trim();
		var confirmEmail = $('#confirmEmail').val().trim();
		var currentPassword = $('#password').val().trim();
		var newPassword = $('#newPassword').val().trim();
		var confirmPassword = $('#confirmPassword').val().trim();
		var name = $('#name').val().trim();
		var location = $('#location').val().trim();
		var bio = $('#bio').val().trim();

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
					$('#updateSuccess').removeClass('d-none').fadeOut(3000);
					$('#password, #newPassword, #confirmPassword').val('');
					window.scrollTo(0, 0);
				}
			});
		}
	});
});
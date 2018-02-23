$(document).ready(function(){
	var urlSplit = window.location.pathname.split('/');
	var token = urlSplit[urlSplit.length - 1];

	$('#resetForm').on('submit', function(event) {
		event.preventDefault();
		var newPassword = $('#newPassword').val().trim();
		var confirmPassword = $('#confirmPassword').val().trim();
		var errors = false;

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

		if (!errors) {
			$.ajax('/reset/' + token, {
				type: 'PUT',
				data: { 
					password: newPassword
				}
			});
			$('#resetConfirmed').removeClass('d-none');
			$('#resetForm').hide();
			$('#password, #newPassword, #confirmPassword').val('');
			window.scrollTo(0, 0);
		}
	});
});
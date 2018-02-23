$(document).ready(function() {
    $('#forgotForm').on('submit', function(event) {
        event.preventDefault();
        $.ajax('/forgot', {
            type: 'POST',
            data: { 
                email: $('#email').val().trim(),
            }
        });
        $('#emailSent').removeClass('d-none');
        $('#email').val('');
        $('#forgotForm').hide();
        window.scrollTo(0, 0);
    });
});
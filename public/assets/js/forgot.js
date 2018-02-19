$('#btnSubmit').click(function(){
    if(  validateForm() ){
    }
    else return false;
});


function validateForm() {
    var email = $('#signupEmail').val();

        $.ajax({
            url:"api/user/register",   
            data:{                  
                email:email
           
            }
                if(data > 0 ) {
                    message = "This email is registered already!";
                    messageDialog("Error", message, "error", 2);
                    return false;                   
                }.then(function(data) {
                if (data.error) {
                    if (data.error === 'email') {
                        $('#fgSignupEmail').addClass('has-danger');
                        $('#signupEmail').addClass('is-invalid');
                    }
                } else {
                    location.href='/user/' + username;
                }
            });
        }
    });

    // if everything is right then return true so the submit function continue its execution
    return true;
}
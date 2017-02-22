requirejs(
    [
        '$',
        'utils/api',
        'utils/message'
    ], 
    function(
        $,
        api,
        msg
    ) {
        $(function() {
            var loginForm = $('[data-login-form]');
            
            loginForm.on('submit', function(e) {
                e.preventDefault();
                
                var mail = $('input[name="email"]').val();
                var pass = $('input[name="password"]').val();
                var remember = $('input[name="remember_me"]').is(':checked');

                console.log('LOG ME IN', mail, pass, remember);
                api.call('post', 'login', { remember_me: remember, email: mail, password: pass }).done(function(res) {
                    console.log(res);
                    if (res.error === true) {
                        if (!res.errors.msg) { 
                            msg.error('Error!', res.errors[0].msg);
                        } else {
                            msg.error('Error!', res.errors.msg);
                        }
                    } else {
                        msg.dismiss();
                        
                        sessionStorage.userdata = JSON.stringify(res.user);
                        localStorage.setItem('timelines', JSON.stringify(res.timelines));
                        
                        location.href = res.redirect.match(/\/[\w&=?]*/)[0];
                    }
                })

            });
        });
    }
);

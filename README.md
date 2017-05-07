# Simple Form Validator
simple javascript validator based on elements id and works with json configuration

Example:

         var validationOptions = {
            alertClassName: "custom-alert alert-danger", //bootstrap class for alert message
            "login-email": {
                notempty: {
                    message: "email is required"
                },
                custom: [
                    {
                        name: "correctEmail",
                        isValid: function () {
                            if (v.isEmailValid($("#login-email")))
                                return true;
                            else
                                return false;
                        },
                        message: "wrong email address.",
                        eventType: ["keypress", "change"]
                    },
                ]
            },
            "password": {
                notempty: {
                    message: "password is required."
                }
            },
            "btn-ok": {
                button: {
                    submit: true
                }
            }
        };
        
        


[05/06/2017]
- Just Released the first version.

(function (validator) {

    //enums
    var validationStateSet = {
        hideError: 0,
        showError: 1
    }



    //constant
    var orFalse = " || false";



    //variables
    var validationOptionSet = {};
    var submitFormIsEnable = {};
    var allFieldsAreOk = false;
    var submitButtonId = "";




    //this function get a json variable and validate form based on this json
    var validateForm = function (options) {

        if (options == null || options === undefined || typeof options !== typeof {})
            return;

        validationOptionSet = clone(options);
        var alertClassName = "alert alert-danger";

        if (validationOptionSet.alertClassName !== undefined)
            alertClassName = validationOptionSet.alertClassName;

        //iterate on options
        for (item in validationOptionSet) {

            if (typeof validationOptionSet[item] !== typeof {})
                continue;

            var element = document.getElementById(item);
            if (element === undefined)
                return;

            var warning = createWarningElement(item, alertClassName);
            insertAfter(element, warning);


            for (validation in validationOptionSet[item]) {


                // check default validations 
                if (validation.toLowerCase() === "notempty") {
                    element.addEventListener("change", notEmptyFn);
                    element.addEventListener("keyup", notEmptyFn);
                    submitFormIsEnable[item + validation] = (element.value == "") ? false : true;
                }

                if (validation.toLowerCase() === "button" && validationOptionSet[item][validation].submit === true) {
                    var formElem = closest(element, "form");
                    formElem.addEventListener("change", disableSubmitBtnFn);
                    submitFormIsEnable[item + validation] = true;
                    submitButtonId = item;
                }


                // check custom validations
                if (validation.toLowerCase() === "custom") {

                    var customValidations = validationOptionSet[item][validation];

                    //iterate on validations and add event listner for each one
                    for (var i = 0; i < customValidations.length; i++) {

                        (function () {

                            var ev = clone(customValidations[i]);


                            if (customValidations[i].eventType === undefined) {
                                element.addEventListener("change", function (event) {
                                    event.parameters = ev;
                                    customEventFn(event);
                                }, true);

                            }

                                //those validations that have more than one event type (change, keypress, keyup, ...)
                            else {
                                for (var j = 0, events = customValidations[i].eventType; j < events.length; j++) {
                                    element.addEventListener(events[j], function (event) {
                                        event.parameters = ev;
                                        customEventFn(event);
                                    }, true);
                                }
                            }

                        })();

                    }

                    for (var i = 0; i < customValidations.length; i++) {

                        if (customValidations[i].change)
                            submitFormIsEnable[item + customValidations[i].name] = true;

                        else
                            submitFormIsEnable[item + customValidations[i].name] = true;

                    }


                }

            }

        }

        //trigger change for form after load
        trigger("change", formElem);
    }


    //default not empty event
    var notEmptyFn = function (event) {
        var id = event.target.id;

        if (event.target.value == "" || event.target.value == null)
            toggleMessage(id, validationStateSet.showError, "notempty");

        else
            toggleMessage(id, validationStateSet.hideError, "notempty");
    };


    //disable submit button on form
    var disableSubmitBtnFn = function (event) {
        var flagList = [];

        for (key in submitFormIsEnable) {
            flagList.push(submitFormIsEnable[key]);
        }

        allFieldsAreOk = flagList.reduce(function (acc, value) {
            return acc && value;
        });

        var submitElem = document.getElementById(submitButtonId);

        setTimeout(function () {
            if (!allFieldsAreOk)
                submitElem.setAttribute("disabled", "disabled");

            else
                submitElem.removeAttribute("disabled");
        }, 1000);
    }


    //custom event for custom validations
    var customEventFn = function (event) {
        var id = event.target.id;
        var validation = clone(event.parameters);
        var resultOfValidationFunction = validation.isValid();

        //validation function return boolean
        if (typeof resultOfValidationFunction === "boolean" && resultOfValidationFunction === false)
            toggleMessage(id, validationStateSet.showError, validation.name, validation.message);


        else if (typeof resultOfValidationFunction === "boolean" && resultOfValidationFunction === true)
            toggleMessage(id, validationStateSet.hideError, validation.name);


            //validation function return an string
        else if (typeof resultOfValidationFunction === "string")
            toggleMessage(id, validationStateSet.showError, validation.name, resultOfValidationFunction);

    };


    //toggle message 
    function toggleMessage(id, validationState, validationType, message) {

        var warElem = document.getElementById(event.target.id + "Error");
        var formElem = closest(warElem, "form");
        var submitType = formElem.getAttribute("ng-submit") ? "ng-submit" : "submit";
        var validationBoolIndex = id + validationType;
        var dontHideErrorBox = false;

        if (validationState == validationStateSet.hideError) {
            submitFormIsEnable[validationBoolIndex] = true;

            for (key in submitFormIsEnable) {
                if (key.substr(0, id.length) === id && submitFormIsEnable[key] == false) {
                    dontHideErrorBox = true;
                }
            }

            if (dontHideErrorBox)
                return;

            warElem.setAttribute("style", "display: none;");
            //todo: inteligent clear specific message
            warElem.innerHTML = "";
            var attr = formElem.getAttribute(submitType);
            var indexOfOrFalse = attr.indexOf(orFalse);
            formElem.setAttribute(submitType, attr.substr(0, indexOfOrFalse > 0 ? indexOfOrFalse : attr.length));
            trigger("change", formElem);

        } else if (validationState == validationStateSet.showError) {
            warElem.innerHTML = (message === undefined) ? validationOptionSet[id][validationType].message : message;
            warElem.setAttribute("style", "display: normal;");
            formElem.setAttribute(submitType, formElem.getAttribute(submitType) + orFalse);
            formElem.setAttribute(submitType, formElem.getAttribute(submitType) + orFalse);
            submitFormIsEnable[validationBoolIndex] = false;
            trigger("change", formElem);
        }
    }






    /*
		ecent handlers that validate a condition
	*/
    //return true if key preessed is number key
    var isNumberKey = function (evt) {

        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;

        if (
				(charCode > 47 && charCode < 58) || 				//english digits
					(
						(charCode > 1631 && charCode < 1642) ||  	//persian/arabic digits
						(charCode > 1775 && charCode < 1786)	 	//persian/arabic digits
					)
			)

            return true;


        return false;
    }


    //return true if key preessed is a persian char
    var isPersianKey = function (evt, withSpace) {

        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;

        if (
				charCode > 1536 && charCode < 1791 || 				//unicode arabic characters include digits
					(
						(charCode == 8204 && withSpace) || 			//half-space: 	8204 
						(charCode == 32 && withSpace)				//full-space: 	32
					)
			)

            return true;


        return false;
    }


    //return true if key preessed is english char
    var isEnglishKey = function (evt) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;

        if (
				(charCode == 32) ||
				(48 <= charCode && charCode <= 57) ||
				(65 <= charCode && charCode <= 90) ||
				(97 <= charCode && charCode <= 122)
			)

            return true;


        return false;
    }


    //limit textbox to limit char
    var limitedTo = function (evt, limit) {

        return (evt.currentTarget.value.length < limit);
    }






    /*
		validation based on parameter sent to function
		this functions works with both, elementId and
		event fired on element (if it used with event)
	*/
    //check if the value of target of event is emty or not
    var isElementEmpty = function (evt) {

        if (evt instanceof Object) {

            evt = (evt) ? evt : window.event;
            var input = evt.target.value;

            if (
					input == null ||
					input === undefined ||
					input == ""
				)

                return true;


            return false;

        }

        else if (typeof evt === "string") {
            var val = document.getElementById(evt).value;

            if (
					val == "" ||
					val == undefined ||
					val == isNaN
				)
                return true;


            return false;
        }


    }


    //return true if code passed to it, is a valid iranian national code
    var isNationalCodeIsValid = function (evt) {

        evt = (evt) ? evt : window.event;
        var input = evt.target.value;

        if (!/^[\u06F0-\u06F90-9]{10}$/.test(input))
            return false;

        input = faToEnDigit(input);

        var controlCode = Number(input[9]);
        var sumOfCodeSet = 0;

        for (var i = 0; i < 9; i++) {
            sumOfCodeSet += parseInt(input[i]) * (10 - i);
        }

        var remainValue = sumOfCodeSet % 11;

        if (
				(remainValue < 2 && remainValue === controlCode) ||
				(remainValue >= 2 && (controlCode + remainValue) === 11)
			)
            return true;


        return false;
    }


    //return true if email address is typed correctly
    var isEmailValid = function (evt) {

        //pattern for detect valid enail address
        var pattern = /([\w\.]+)@([\w\.]+)\.(\w+)/;
        var email = "";

        if (evt instanceof jQuery) {
            email = evt.val();
        }

        else if (evt instanceof Object) {
            evt = (evt) ? evt : window.event;
            email = evt.target.value;
        }

        else if (typeof evt === "string") {
            email = evt;
        }

        if (pattern.test(email))
            return true;

        else
            return false;

    }






    /*
		DOM Manipulation Helper functions. this functions help to select, query
		create and append elements to other elements
	*/
    //insert an element after another
    var insertAfter = function (referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }


    //get the nearest selector parent element 
    var closest = function (el, selector) {
        var matchesFn;

        // find vendor prefix
        ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (fn) {
            if (typeof document.body[fn] == 'function') {
                matchesFn = fn;
                return true;
            }
            return false;
        })

        var parent;

        // traverse parents
        while (el) {
            parent = el.parentElement;
            if (parent && parent[matchesFn](selector)) {
                return parent;
            }
            el = parent;
        }

        return null;
    }


    //create a bootstrap alert element
    var createWarningElement = function (id, cssClassName) {
        var div = document.createElement("div");

        div.setAttribute("style", "display:none;");
        div.setAttribute("id", id + 'Error');
        div.className = cssClassName;

        return div;
    }


    //trigger an event on a specific element
    var trigger = function (type, element) {
        var evt = document.createEvent("Events");
        evt.initEvent(type, true, true, window, 1);
        element.dispatchEvent(evt);
    }




    /*
		utility functions
	*/
    //clone an objectby A. Levy  &&  elliotbonneville
    var clone = function (obj) {
        var copy;

        // Handle the 3 simple types, and null or undefined
        if (obj == null || obj != typeof "object" || obj === undefined)
            return obj;


        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }


        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0; i < obj.length; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }


        // Handle Object
        if (obj instanceof Object) {
            copy = obj.constructor();
            for (var key in obj) {
                copy[key] = clone(obj[key]);
            }

            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }


    //convert english digits to persian
    var enToFaDigit = function (num) {

        if (isNaN(num))
            return false;

        var input = num.toString();
        var x = [];

        for (var i = 0; i < input.length; i++) {
            x[i] = input[i]
			.replace(/[0-9]/,
			function (d) {
			    return d.charCodeAt(0) + 1632;
			});
        }

        input = x.join("");

        return Number(input);
    }


    //convert persian digits to english
    var faToEnDigit = function (num) {

        if (isNaN(num))
            return false;

        var input = num.toString();
        var x = [];

        for (var i = 0; i < input.length; i++) {
            x[i] = input[i]
			.replace(/[\u0660-\u0669]/,
			function (d) {
			    return d.charCodeAt(0) - 1632;

			})
			.replace(/[\u06F0-\u06F9]/,
			function (d) {
			    return d.charCodeAt(0) - 1776;
			});
        }
        input = x.join("");

        return Number(input);
    }






    //now, reveal it
    validator.validateForm = validateForm;

    validator.isNumberKey = isNumberKey;
    validator.isPersianKey = isPersianKey;
    validator.isEnglishKey = isEnglishKey;
    validator.limitedTo = limitedTo;

    validator.isElementEmpty = isElementEmpty;
    validator.isNationalCodeIsValid = isNationalCodeIsValid;
    validator.isEmailValid = isEmailValid;

    validator.insertAfter = insertAfter;
    validator.closest = closest;
    validator.createWarningElement = createWarningElement;
    validator.trigger = trigger;

    validator.clone = clone;
    validator.enToFaDigit = enToFaDigit;
    validator.faToEnDigit = faToEnDigit;

    return validator;


})(this.v = {});

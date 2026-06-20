
const sign_up_form = document.getElementsByClassName("signup-form")[0];
const login_form = document.getElementsByClassName("login-form")[0];
const buttons = document.getElementsByClassName("buttons")[0];
const signup_button = document.getElementsByClassName("signup-button")[0];
const login_button = document.getElementsByClassName("login-button")[0];
const firstname_input = document.getElementById("firstname-input");
const lastname_input = document.getElementById("lastname-input")
const email_input = document.getElementById("email-input");
const email_input_login = document.getElementById("email-input-login"); //test later if it is really needed or I can have both with same ID
const password_input = document.getElementById("password-input");
const password_input_login = document.getElementById("password-input-login");
const repeat_password_input = document.getElementById("repeat-password-input");
const error_message = document.getElementById("error-message")
const signup_submit = document.getElementsByClassName("signup-submit")[0];
const login_submit = document.getElementsByClassName("login-submit")[0];

const allInputs = [firstname_input, lastname_input, email_input, email_input_login, password_input, password_input_login, repeat_password_input]

const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8081'
    : 'https://virax5.github.io/DnD-Assistant-Part-One/'

const fieldToInputMap = {
    'firstname': firstname_input,
    'lastname': lastname_input,
    'email': email_input,
    'password': password_input,
    'repeatPassword': repeat_password_input,
    'emailLogin': email_input_login,
    'passwordLogin': password_input_login
}


// const json = {"firstname": "Amit", "lastname": "Lachmann", "email": "amit505r@gmail.com", "password": "HelloWorld"};
// const parsed = JSON.parse(jsonPreParse)

signup_button.addEventListener('click', () => {
    if (signup_button.classList.contains("not-clicked")) {
        login_button.classList.remove('clicked')
        login_button.classList.add('not-clicked')
        login_form.classList.remove('active')
        login_form.classList.add('not-active')
        error_message.innerText = ''
        signup_button.classList.remove('not-clicked')
        signup_button.classList.add('clicked')
        sign_up_form.classList.remove('not-active')
        sign_up_form.classList.add('active')

        allInputs.forEach(input => {

            if (input.parentElement.classList.contains('incorrect')) {
                input.parentElement.classList.remove('incorrect')
                error_message.innerText = ''
            }

        })
    }
})

login_button.addEventListener('click', () => {
    if (login_button.classList.contains("not-clicked")) {
        signup_button.classList.remove('clicked')
        signup_button.classList.add('not-clicked')
        sign_up_form.classList.remove('active')
        sign_up_form.classList.add('not-active')
        error_message.innerText = ''
        login_button.classList.remove('not-clicked')
        login_button.classList.add('clicked')
        login_form.classList.remove('not-active')
        login_form.classList.add('active')
    }
})

// sign_up_form.addEventListener('submit', (e) => {         //MOVING THIS FUNCTION TO BACKEND
//     e.preventDefault()

//     let errors = []
//     errors = getSignupFormErrors(firstname_input.value, lastname_input.value, email_input.value, password_input.value, repeat_password_input.value)

//     if (errors.length > 0) {
//         errors.push("")
//         error_message.innerText = errors.join(". \n")
//     }
//     else
//     {
//         /* logic for adding data to json and data base */
//         window.location.href = "./campaignList.html";
//     }
//     signup_submit.blur()
// })

// login_form.addEventListener('submit', (e) => {           //MOVING THIS FUNCTION TO BACKEND
//     e.preventDefault()

//     let errors = []
//     errors = getLoginFormErrors(email_input_login.value, password_input_login.value)

//     if (errors.length > 0) {
//         errors.push("")
//         error_message.innerText = errors.join(". \n")
//     }
//     else
//     {
//         window.location.href = "./campaignList.html";
//     }
//     login_submit.blur()
// })


sign_up_form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const userData = {
        firstname: firstname_input.value,
        lastname: lastname_input.value,
        email: email_input.value,
        password: password_input.value,
        repeatPassword: repeat_password_input.value
    }

    try {
        const response = await fetch(`${BASE_URL}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        })

        const data = await response.json()

        if (!data.success) {
            if (response.status === 400) {
                let errorMessages = []
                data.errors.forEach(err => {
                    errorMessages.push(err.msg);
                    if (fieldToInputMap[err.field]) {
                        fieldToInputMap[err.field].parentElement.classList.add('incorrect');
                    }
                });
                error_message.innerText = errorMessages.join(". \n")
            }
            else if (response.status === 500) {
                console.error("Error creating the account: ", data.err)
                error_message.innerText = "A server error occurred. Please try again later."
            }
        }
        else {
            window.location.href = data.redirect
        }
    }
    catch (error) {
        console.error("Error communicationg with backend:", error)
    }
    signup_submit.blur()
})

login_form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginData = {
        email: email_input_login.value,
        password: password_input_login.value
    };

    try {
        const response = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if(!data.success)
        {
            if (data.errors) {
                let errorMessages = [];
                data.errors.forEach(err => {
                    errorMessages.push(err.msg);
                    if (fieldToInputMap[err.field]) {
                        fieldToInputMap[err.field].parentElement.classList.add('incorrect');
                    }
                });
                error_message.innerText = errorMessages.join(". \n");
            }
            else if (data.error) {
                email_input_login.parentElement.classList.add('incorrect')
                password_input_login.parentElement.classList.add('incorrect')

                error_message.innerText = data.error
            }
        }
        else {
            window.location.href = data.redirect;
        }
    } catch (error) {
        console.error("Error communicating with backend:", error);
    }
    login_submit.blur();
})

function getSignupFormErrors(firstname, lastname, email, password, repeatPassword) {
    let errors = []

    if (firstname === '' || firstname == null) {
        errors.push('First name is required')
        firstname_input.parentElement.classList.add('incorrect')
    }
    if (lastname === '' || lastname == null) {
        errors.push('Last name is required')
        lastname_input.parentElement.classList.add('incorrect')
    }
    if (email === '' || email == null) {
        errors.push('Email is required')
        email_input.parentElement.classList.add('incorrect')
    }
    if (json.email === email) {
        errors.push('This email already has an account')
        email_input.parentElement.classList.add('incorrect')
    }
    if (password === '' || password == null) {
        errors.push('Password is required')
        password_input.parentElement.classList.add('incorrect')
    }
    if (password.length < 8) {
        errors.push('Password must have at least 8 characters')
        password_input.parentElement.classList.add('incorrect')
    }
    /* maybe add testing for uppercase/lowercase chars*/
    if (password !== repeatPassword) {
        errors.push('Password does not match repeated password')
        password_input.parentElement.classList.add('incorrect')
        repeat_password_input.parentElement.classList.add('incorrect')
    }

    return errors;
}

function getLoginFormErrors(email, password) {
    let errors = []

    if (email === '' || email == null) {
        errors.push('Email is required')
        email_input_login.parentElement.classList.add('incorrect')
    }
    if (email !== json.email) {
        errors.push("Wrong email")
        email_input_login.parentElement.classList.add('incorrect')
    }
    else if (password !== json.password && password !== '') {
        errors.push("Wrong password")
        password_input_login.parentElement.classList.add('incorrect')
    }
    if (password === '' || password == null) {
        errors.push('Password is required')
        password_input_login.parentElement.classList.add('incorrect')
    }


    return errors
}


allInputs.forEach(input => {
    input.addEventListener('input', () => {
        if (input.parentElement.classList.contains('incorrect')) {
            input.parentElement.classList.remove('incorrect')
            error_message.innerText = ''
        }
    })
})
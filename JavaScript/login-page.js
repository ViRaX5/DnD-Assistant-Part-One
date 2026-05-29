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

const allInputs = [firstname_input, lastname_input, email_input, email_input_login, password_input, password_input_login, repeat_password_input]

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

sign_up_form.addEventListener('submit', (e) => {

    let errors = []
    errors = getSignupFormErrors(firstname_input.value, lastname_input.value, email_input.value, password_input.value, repeat_password_input.value)

    if (errors.length > 0) {
        e.preventDefault()
        errors.push("")
        error_message.innerText = errors.join(". \n")
    }
})

login_form.addEventListener('submit', (e) => {

    let errors = []
    errors = getLoginFormErrors(email_input_login.value, password_input_login.value)

    if (errors.length > 0) {
        e.preventDefault()
        errors.push("")
        error_message.innerText = errors.join(". \n")
    }
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
    if (password === '' || password == null) {
        errors.push('Password is required')
        password_input_login.parentElement.classList.add('incorrect')
    }

    // if(email === '' || email == null)
    // {
    //     errors.push("Email is required")
    //     email_input_login.parentElement.classList.add('incorrect')
    // }
    // if(password === '' || password == null)
    // {
    //     errors.push("Password is required")
    //     password_input_login.parentElement.classList.add('incorrect')
    // }

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
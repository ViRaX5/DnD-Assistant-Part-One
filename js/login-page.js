
localStorage.removeItem('accessToken')

const sign_up_form = document.getElementsByClassName("signup-form")[0]
const login_form = document.getElementsByClassName("login-form")[0]
const buttons = document.getElementsByClassName("buttons")[0]
const signup_button = document.getElementsByClassName("signup-button")[0]
const login_button = document.getElementsByClassName("login-button")[0]
const firstname_input = document.getElementById("firstname-input")
const lastname_input = document.getElementById("lastname-input")
const email_input = document.getElementById("email-input")
const email_input_login = document.getElementById("email-input-login")
const password_input = document.getElementById("password-input")
const password_input_login = document.getElementById("password-input-login")
const repeat_password_input = document.getElementById("repeat-password-input")
const error_message = document.getElementById("error-message")
const signup_submit = document.getElementsByClassName("signup-submit")[0]
const login_submit = document.getElementsByClassName("login-submit")[0]
const loading_dialog = document.getElementById("loading-dialog")

const allInputs = [firstname_input, lastname_input, email_input, email_input_login, password_input, password_input_login, repeat_password_input]

const fieldToInputMap = {
    'firstname': firstname_input,
    'lastname': lastname_input,
    'email': email_input,
    'password': password_input,
    'repeatPassword': repeat_password_input,
    'emailLogin': email_input_login,
    'passwordLogin': password_input_login
}

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

sign_up_form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const userData = {
        firstname: firstname_input.value,
        lastname: lastname_input.value,
        email: email_input.value,
        password: password_input.value,
        repeatPassword: repeat_password_input.value
    }

    error_message.innerText = ''
    loading_dialog.showModal()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
        const response = await fetch(`${BASE_URL}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
            signal: controller.signal,
            credentials: 'include'
        })

        clearTimeout(timeoutId)
        const data = await response.json()

        if (!data.success) {
            if (response.status === 400) {
                let errorMessages = []
                data.errors.forEach(err => {
                    errorMessages.push(err.msg)
                    if (fieldToInputMap[err.field]) {
                        fieldToInputMap[err.field].parentElement.classList.add('incorrect')
                    }
                })
                error_message.innerText = errorMessages.join(". \n")
            }
            else if (response.status === 500) {
                console.error("Error creating the account: ", data.err)
                error_message.innerText = "A server error occurred. Please try again later."
            }
        }
        else {
            localStorage.setItem('accessToken', data.token)
            window.location.href = data.redirect
        }
    }
    catch (err) {
        clearTimeout(timeoutId)
        console.error("Error communicationg with backend:", err)

        if (err.name === 'AbortError') {
            error_message.innerText = "Request timed out. The server took too long to respond."
        } else {
            error_message.innerText = "Could not connect to the server. Please try again later."
        }
    }
    finally {
        loading_dialog.close()
        signup_submit.blur()
    }
})

login_form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const loginData = {
        email: email_input_login.value,
        password: password_input_login.value
    }

    error_message.innerText = ''
    loading_dialog.showModal()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
        const response = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
            signal: controller.signal,
            credentials: 'include'
        })

        clearTimeout(timeoutId)
        const data = await response.json()

        if(!data.success)
        {
            if (data.errors) {
                let errorMessages = []
                data.errors.forEach(err => {
                    errorMessages.push(err.msg)
                    if (fieldToInputMap[err.field]) {
                        fieldToInputMap[err.field].parentElement.classList.add('incorrect')
                    }
                })
                error_message.innerText = errorMessages.join(". \n")
            }
            else if (data.error) {
                email_input_login.parentElement.classList.add('incorrect')
                password_input_login.parentElement.classList.add('incorrect')

                error_message.innerText = data.error
            }
        }
        else {
            localStorage.setItem('accessToken', data.token)
            window.location.href = data.redirect
        }
    } catch (err) {
        clearTimeout(timeoutId)
        console.error("Error communicating with backend:", err)

        if (err.name === 'AbortError') {
            error_message.innerText = "Request timed out. The server took too long to respond."
        } else {
            error_message.innerText = "Could not connect to the server. Please try again later."
        }
    }
    finally {
        loading_dialog.close()
        login_submit.blur()
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
    if (password !== repeatPassword) {
        errors.push('Password does not match repeated password')
        password_input.parentElement.classList.add('incorrect')
        repeat_password_input.parentElement.classList.add('incorrect')
    }

    return errors
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
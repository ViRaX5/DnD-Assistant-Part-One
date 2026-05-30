const log_out = document.getElementsByClassName("log-out")[0];

log_out.addEventListener('click', () => {
    const confirm = window.confirm("Are you sure you want to log out?")

    if(confirm)
    {
        window.location.href = "./index.html"
    }
});
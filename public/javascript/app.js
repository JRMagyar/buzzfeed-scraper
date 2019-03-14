window.onload = function() {

    $("#submit-button").on("click", function(){
        event.preventDefault();
        console.log("submit click")

        userComment = {
            user : $("#username-input").val(),
            body : $("#comment-input").val()
        }

        return $.ajax({
            headers: {
              "Content-Type": "application/json"
            },
            type: "POST",
            url: window.location.href,
            data: JSON.stringify(userComment)
        }).then(location.reload())

          
    })
}
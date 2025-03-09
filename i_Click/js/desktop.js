$(function() {
    var btnInternetExplorer = $("#IE");

    btnInternetExplorer.on("click", function() {
        $(location).attr("href", "./index.html");
    });
});
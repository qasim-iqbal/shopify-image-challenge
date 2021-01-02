const Http = new XMLHttpRequest()
const url= 'http://localhost:5000/get_labels'

Http.open("POST", url)

Http.onreadystatechange=function(){
    if(this.readyState==4 && this.status==200){
        console.log(Http.responseText)
    }
}

var folder = "./images/";

function LoadImagesOnPage(){
    $.ajax({
        url : folder,
        success: function (data) {
            $(data).find("a").attr("href", function (i, val) {
                if( val.match(/\.(jpe?g|png|gif|jfif)$/) ) { 
                    $("#images_gallery").append( "<img src='"+ folder + val +"'>" );
                } 
            });
        }
    });
}

window.onload = LoadImagesOnPage()

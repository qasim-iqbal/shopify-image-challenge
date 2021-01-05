const Http = new XMLHttpRequest()
const url= 'http://localhost:5000/get_labels'

Http.open("POST", url)

Http.onreadystatechange=function(){
    if(this.readyState==4 && this.status==200){
        console.log(Http.responseText)
    }
}


function LoadImagesOnPage(){

    $.ajax({
        url : "/images",
        success: function (data) {
            for (var i = 0; i<data.length; i++){
                if( data[i].match(/\.(jpe?g|png|gif|jfif)$/) ) { 
                    $("#photos").append( "<img class='photo' src='static/images/"+data[i]+"'>" );
                } 
            }
 
        }
    });

}


function getMatchingExif() {

    var inputText = $("#txtTagInput").val()
    console.log(inputText)
    if (inputText.length >= 3){
        // hide all images
        $(".photo").hide()

        // show only then ones that match the tag
        var images = $("#photos").children()
        for (var i = 0; i < images.length; i++) {
            var img1 = $("#photos").children()[i];
            EXIF.getData(img1, function() {
                var tags = EXIF.getTag(this,"ImageDescription")

                if (tags !== undefined){  // if image has tags
                    if (tags.includes(inputText)){
                        // split on tags
                        // TODO: add NLP word vectors to check how similar words are to be shown
                        $(img1).show()
                    }else{
                        $(img1).hide()
                    }
                }
            });
        }

    }else{
        // do nothing
        $(".photo").show()
    }

}

$( document ).ready(function() {
    LoadImagesOnPage(); 
    
    $("#txtTagInput").on("input",function(){getMatchingExif()})
    $("#searchbtn").on("click",function(){getMatchingExif()})

});


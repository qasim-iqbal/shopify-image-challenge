

function LoadImagesOnPage(){

    $.ajax({
        url : "/images",
        success: function (data) {
            for (var i = 0; i<data.length; i++){
                if( data[i].match(/\.(jpe?g|png|gif|jfif)$/) ) { 
                    $("#photos").append( "<img id='img_"+i+"' ondragstart='onDragStart(event)'  class='photo' draggable='True' src='static/images/"+data[i]+"'>" );
                } 
            }
 
        }
    });

}

function getMatchingExif(tags) {

    var inputText = JSON.stringify(tags)
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


// Sending AJAX request and upload file
function uploadData(file){

    var form_data = new FormData();

    form_data.append('image_in', file);

    $.ajax({
        url: '/get_labels',
        type: 'post',
        data: form_data,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: function(response){
            console.log(response)
            getMatchingExif(response)
        }
    });
}


function onDragStart(event){
    event.dataTransfer.setData('text/plain', event.target.id)
    console.log(event.target.id)
}


function imgDragSearch(id){
    var img = document.getElementById(id);
    if (img != null){
        EXIF.getData((img), function() {
            var tags = EXIF.getTag(this,"ImageDescription");
            getMatchingExif(tags)
        });
    }
}

function imgUploadSearch(file){
    var img = document.getElementById(id);
    EXIF.getData((img), function() {
        var tags = EXIF.getTag(this,"ImageDescription");
        getMatchingExif(tags)
    });

}


$( document ).ready(function() {
    LoadImagesOnPage(); 
    
    $("#txtTagInput").on("input",function(e){getMatchingExif($("#txtTagInput").val())})
    $("#searchbtn").on("click",function(e){getMatchingExif($("#txtTagInput").val())})

    // add dragover and dragenter events later?
    $("#upload_data").bind("drop", function(e) {
        e.preventDefault();  
        e.stopPropagation();
        // uploadData(event);
        img_id = e.originalEvent.dataTransfer.getData("text")
        if (img_id != ""){
            console.log("dragable element sent")
            imgDragSearch(img_id)
        }else{
            var imageType = /image.*/;
            file = e.originalEvent.dataTransfer.files[0]
            if (file.type.match(imageType)) {
                // a lot more work to resize image here, do it on server side
                uploadData(file)
            }else{
                alert("Only image types such as 'jpg| png| jfif' file types allowed")
            }
            // console.log("uploaded file sent")
            // console.log(e.originalEvent.dataTransfer.files)
        }
    });

});


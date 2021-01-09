

function LoadImagesOnPage(){

    $.ajax({
        url : "/images",
        success: function (data) {
            for (var i = 0; i<data.length; i++){
                if( data[i].match(/\.(jpe?g|png|gif|jfif)$/) ) { 
                    $(".photos").append( "<img id='img_"+i+"' ondragstart='onDragStart(event)'  class='photo' draggable='True' src='static/images/"+data[i]+"'>" );
                } 
            }
 
        }
    });

}

function getMatchingExif(tags) {
    
    // turn parameters to individual tags
    if (typeof tags == "object"){
        if (tags.length == 0){
            alert("No match found!")
            return true // if empty then pass
        }else{
            tags = JSON.stringify(tags)
        }
    }
    else if (typeof tags == "string"){
        if (tags.length  <= 3){
            alert("No match found!")
            return true // if empty then pass
        }
    }
    tags = tags.split(",")
    for(var i=0; i < tags.length; i++){
        tags[i] = tags[i].replace(/[^a-z]+/gi, "");
    }
    
    if (tags[0].length >= 3){
        // hide all images
        $(".photo").hide()

        // show only then ones that match the tag
        var images = $(".photos").children()
        for (let i = 0; i < images.length; i++) {
            let img1 = $(".photos").children()[i];
            console.log("img searched : ", img1.id)
            EXIF.getData(img1, function() {
                let img_tags = EXIF.getTag(this,"ImageDescription")

                if (img_tags !== undefined){  // if image has tags
                    img_tags = img_tags.split(",")
                    for(let j=0; j < img_tags.length; j++){
                        img_tags[j] = img_tags[j].replace(/[^a-z]+/gi, "");
                    }
                    // check if any tag matches form image array to passed array
                    // console.log("img_tag matches?: ",tags.some(img_tag => img_tags.includes(img_tag)), img_tags, tags, img1.id)

                    if (tags.some(img_tag => img_tags.includes(img_tag))){
                        // split on tags
                        // TODO: add NLP word vectors to check how similar words are to be shown
                        $(img1).show()
                    }
                }
            });
        }

    }else{
        $(".photo").show()
    }


}

// Sending AJAX request and upload file
function uploadData(file){

    $("#loader").show()
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
            $("#loader").hide()
        }
    });
}

function onDragStart(event){
    event.dataTransfer.setData('text/plain', event.target.id)
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
    $("#loader").hide()

    // add images to page
    LoadImagesOnPage(); 
    
    $('#logo').click(function() {
        location.reload();
    });


    $('#txtTagInput').keypress(function (e) {
        if (e.which == 13) {
          $('#searchbtn').click();
          return false;  
        }
      });
    // $("#txtTagInput").on("input",function(e){getMatchingExif($("#txtTagInput").val())})
    $("#searchbtn").on("click",function(e){getMatchingExif($("#txtTagInput").val())})

    // add dragover and dragenter events later?
    $("#upload_data").bind("drop", function(e) {
        e.preventDefault();  
        e.stopPropagation();

        // uploadData(event);
        img_id = e.originalEvent.dataTransfer.getData("text")
        if (img_id != ""){
            // console.log("dragable element sent")
            imgDragSearch(img_id)
        }else{
            var imageType = /image.*/;
            file = e.originalEvent.dataTransfer.files[0]
            if (file.type.match(imageType)) {
                uploadData(file)
            }else{
                alert("Only image types such as [jpg| png| jfif] file types allowed")
            }
        }
    });

});


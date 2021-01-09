// CONSTANTS
const MIN_TAG_LENGTH = 2 

// When browswer loads, display images from server
function LoadImagesOnPage(){

    // load images form the server, and display them on browser
    $.ajax({
        url : "/images",
        success: function (data) {
            for (var i = 0; i<data.length; i++){
                if( data[i].match(/\.(jpe?g|png|gif|jfif)$/) ) { 
                    $(".photos").append( "<img id='img_"+i+"' ondragstart='onDragStart(event)'  class='photo' draggable='True' src='static/images/"+data[i]+"'>" )
                } 
            }
 
        }
    })

}

// update images on page, with specific tags
function getMatchingExif(tags) {
    
    // turn parameters to individual tags
    if (typeof tags == "object"){
        if (tags.length == 0){ // empty array
            alert("No match found!")
            return true // if empty then pass
        }else{
            tags = JSON.stringify(tags)
        }
    }
    else if (typeof tags == "string"){
        if (tags.length  <= MIN_TAG_LENGTH){
            alert("No match found!")
            return true // if empty then pass
        }
    }
    tags = tags.split(",")
    for(var i=0; i < tags.length; i++){
        tags[i] = tags[i].replace(/[^a-z]+/gi, "")
    }
    
    if (tags[0].length >= MIN_TAG_LENGTH){
        // hide all images
        $(".photo").hide()

        // show only then ones that match the tag
        var images = $(".photos").children()
        for (let i = 0; i < images.length; i++) {
            let img1 = $(".photos").children()[i]
            console.log("img searched : ", img1.id)
            EXIF.getData(img1, function() {
                let img_tags = EXIF.getTag(this,"ImageDescription")

                if (img_tags !== undefined){  // if image has tags
                    img_tags = img_tags.split(",")
                    for(let j=0; j < img_tags.length; j++){
                        img_tags[j] = img_tags[j].replace(/[^a-z]+/gi, "")
                    }
                    // check if any tag matches form image array to passed array
                    if (tags.some(img_tag => img_tags.includes(img_tag))){
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
    // send image to server
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

// when image element is dragged on page
function onDragStart(event){
    //  when image is dragged get its tag id
    event.dataTransfer.setData('text/plain', event.target.id)
}

// show relevant images to the one the image dragged on
function imgDragSearch(id){
    // when image id element is dragged, show relevant results
    var img = document.getElementById(id);
    if (img != null){
        EXIF.getData((img), function() {
            var tags = EXIF.getTag(this,"ImageDescription");
            getMatchingExif(tags)
        });
    }
}

// show relevant images to image dropped on page from client computer
function imgUploadSearch(file){
    // image file uploaded, show relevant results
    var img = document.getElementById(id);
    EXIF.getData((img), function() {
        var tags = EXIF.getTag(this,"ImageDescription");
        getMatchingExif(tags)
    });
}

// when page loads
$( document ).ready(function() {
    // file upload indicator
    $("#loader").hide()

    // add images to page
    LoadImagesOnPage(); 
    
    $('#logo').click(function() {
        location.reload();
    });

    // bind enter key to search button 
    $('#txtTagInput').keypress(function (e) {
        if (e.which == 13) {
          $('#searchbtn').click();
          return false;  
        }
      });

    // search for images when search button is clicked
    $("#searchbtn").on("click",function(e){getMatchingExif($("#txtTagInput").val())})

    // add dragover and dragenter events later?
    $("#upload_data").bind("drop", function(e) {
        e.preventDefault();  
        e.stopPropagation();

        // check if image is a page element or new image?
        img_id = e.originalEvent.dataTransfer.getData("text")
        if (img_id != ""){
            // page element
            imgDragSearch(img_id)
        }else{
            // new file uploaded
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


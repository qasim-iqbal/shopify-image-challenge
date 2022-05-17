
// CONSTANTS
const MIN_TAG_LENGTH = 2 
const MAX_CHAR_LIMIT = 100

// When browswer loads, display images from server
function loadImagesOnPage(){

    // load images form the server, and display them on browser
    $.ajax({
        url : "/images",
        success: function (data) {
            for (var i = 0; i<data.length; i++){
                if( data[i].match(/\.(jpe?g|png|gif|jfif)$/) ) { 
                    let div = $('<div></div>').addClass('col-sm-6 col-md-4 col-lg-3 item');

                    let photo = $(`<img 
                                        id='img_${i}' 
                                        ondragstart='onDragStart(event)'   
                                        class='photo img-fluid w-100 shadow-1-strong rounded mb-4' 
                                        draggable='True' 
                                        on
                                        src='static/images/${data[i]}'>`);


                    $('.photos').append(div.append(photo))
                } 
            }
        }
    })

}


// update images on page, with specific tags
function getMatchingExif(tags) {
    
    // turn parameters to individual tags
    if (typeof tags == "object" || typeof tags == "string"){
        if (tags.length == 0 || tags.length <= MIN_TAG_LENGTH){ // empty array
            alert("No match found!")
            return true // if empty then pass
        }else{
            tags = JSON.stringify(tags)
        }
    }
    tags = tags.split(",")
    for(var i=0; i < tags.length; i++){
        tags[i] = tags[i].replace(/[^a-z]+/gi, "")
    }
    
    if (tags[0].length >= MIN_TAG_LENGTH){
        // hide all images
        $(".photo").parent().hide()

        // show only then ones that match the tag
        var images = $(".photo")

        for (let i = 0; i < images.length; i++) {
            let img1 = images[i]
            // console.log(img1)
            // console.log("img searched : ", img1.id)
            EXIF.getData(img1, function() {
                let img_tags = EXIF.getTag(this,"ImageDescription")
                if (img_tags !== undefined){  // if image has tags
                    img_tags = img_tags.split(",")
                    for(let j=0; j < img_tags.length; j++){
                        img_tags[j] = img_tags[j].replace(/[^a-z]+/gi, "")
                    }
                    // check if any tag matches form image array to passed array
                    // if (tags.some(img_tag => img_tags.includes(img_tag))){
                    //     // TODO: add NLP word vectors to check how similar words are to be shown
                    //     $(img1).parent().show()
                    // }
                    for (let t=0; t< tags.length; t++){
                        for (let im_tag=0; im_tag< img_tags.length; im_tag++){
                            if (levenshteinDistance(tags[t], img_tags[im_tag]) <=2){
                                $(img1).parent().show()
                            }
                        }
                    }
                    
                }
            });

        }
        $(".photo").filter(function () {
            item = $(this).css("display") == "none";
            $(item).remove()
        });

    }else{
        $(".photo").show()
    }


}
const levenshteinDistance = (s, t) => {
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const arr = [];
    for (let i = 0; i <= t.length; i++) {
      arr[i] = [i];
      for (let j = 1; j <= s.length; j++) {
        arr[i][j] =
          i === 0
            ? j
            : Math.min(
                arr[i - 1][j] + 1,
                arr[i][j - 1] + 1,
                arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
              );
      }
    }
    return arr[t.length][s.length];
  };

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
            if (response.code[0] == "E"){
                alert("Error! "+ response.message)
            }else{
                getMatchingExif(response.message)
            }
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
    loadImagesOnPage(); 

    $('#logo').click(function() {
        location.reload();
    });

    // bind enter key to search button 
    $('#txtTagInput').keypress(function (e) {
        if (e.which == 13) {
          $('#searchbtn').click();
          return false;  
        }
        if ($('#txtTagInput').val().length > MAX_CHAR_LIMIT){
            alert("Error! maxium character limit is '"+ MAX_CHAR_LIMIT +"'.")
        }
      });

    // search for images when search button is clicked
    $("#searchbtn").on("click",function(e){getMatchingExif($("#txtTagInput").val().toLowerCase())})

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
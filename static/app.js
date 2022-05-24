
// CONSTANTS
const MIN_TAG_LENGTH = 2 
const MAX_CHAR_LIMIT = 100
var total_imgs = 0 
const IMAGES_PER_PAGE = 12
// When browswer loads, display images from server
function loadImagesOnPage(){

    // load images form the server, and display them on browser
    $.ajax({
        url : "/images",
        success: function (data) {
            for (var i = 0; i<data.length; i++){
                total_imgs = data.length;
                if( data[i].match(/\.(jpe?g|png|gif|jfif)$/) ) { 
                    let div = $('<div></div>').addClass('col-sm-6 col-md-4 col-lg-3 item');

                    let photo = $(`<img 
                                        id='img_${i+1}' 
                                        ondragstart='onDragStart(event)'   
                                        class='photo img-fluid w-100 shadow-1-strong rounded mb-4' 
                                        draggable='True' 
                                        on
                                        src='static/images/${data[i]}'>`);

                    $('.photos').append(div.append(photo))
                } 
            }
            setupPagination()
        }
    })


}

// update images on page, with specific tags
function getMatchingExif(tags) {
    
    //  hide pagination
    $('.pagination').hide()

    // turn parameters to individual tags
    if (typeof tags == "object"){
        if (tags.length == 0){ // empty array
            alertMessage("No match found!")
            return true // if empty then pass
        }else{
            tags = JSON.stringify(tags)
        }
    }
    else if (typeof tags == "string"){
        if (tags.length  <= MIN_TAG_LENGTH){
            alertMessage("No match found!")
            return true // if empty then pass
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
            // console.log(response)
            if (response.code[0] == "E"){
                alertMessage(response.message)
            }else{
                getMatchingExif(response.message)
            }
            $("#loader").hide()
        }
    });
}

function setupPagination(){

    var page = 1;

    let btnGroup = $('.pagination')
    
    let numButtons = Math.ceil(total_imgs / IMAGES_PER_PAGE)
    
    // console.log("image count: " + total_imgs)
    // console.log("buttons required: " + numButtons)
    let btnPagePrev = $(`<li id="btnPagePrev" class="page-item"><a class="page-link">Previous</a></li>`)
    btnPagePrev.on('click', function() {
        if (page >  1) {
            page -=1
            goToPage(page)
        }
    })
    btnGroup.append(btnPagePrev)

    for (let i = 0; i < numButtons; i++) {
        let btnPage = $(`<li id='btnPage${i+1}' class="page-item" value=${i+1}><a class="page-link">${i+1}</a></li>`);

        btnPage.on('click', function(e) {
            page = parseInt(e.target.text)
            goToPage(page)
        })
        btnGroup.append(btnPage)
    }
    let btnPageNext = $(`<li id="btnPageNext" class="page-item"><a class="page-link">Next</a></li>`)
    btnPageNext.on('click', function() {
        if (page <  numButtons) {
            page +=1
            goToPage(page)
        }
    })
    btnGroup.append(btnPageNext)

    // go to start page
    goToPage(page)
}

function goToPage(item) {
    
    // console.log(item)

    // remove previous active state
    $(".pagination").find('a').removeClass("active-page");
    let selected_li = $('li[value='+item+']').find('a')
    $(selected_li).addClass('active-page')

    showImages(item, total_imgs)
}

function getImagesRange(pageNum, totalImgs){
    maxPages = Math.ceil(total_imgs/IMAGES_PER_PAGE)
    let min_ =0
    let max_ =0
    if (pageNum > maxPages){ return}

    if (pageNum == 1) {
        min_ = 1
        max_ = IMAGES_PER_PAGE
    } else if (pageNum == maxPages){
        if ((totalImgs / pageNum) % 1 == 0){ // complete set
            min_ =((pageNum -1) * IMAGES_PER_PAGE)+1
            max_ = pageNum * IMAGES_PER_PAGE
        } else {
            min_ = (pageNum -1) * IMAGES_PER_PAGE
            max_ = min_ + (totalImgs % min_)
        }
    } else {
        min_ = ((pageNum -1) * IMAGES_PER_PAGE)+1
        max_ = pageNum * IMAGES_PER_PAGE
    }

    return [min_, max_]
}
function showImages(pageNum, total_imgs) {
    // hide all images

    $(".photo").parent().hide()

    // show only the ones which belong to the page
    let range = getImagesRange(pageNum, total_imgs)

    // console.log(range)
    for (let i = range[0]; i <= range[1]; i++) {
        // console.log(i)
        $(`img[id=img_${i}`).parent().show();     
    }

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


function alertMessage(msg){
    let alertBox = `    
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>Error!</strong> ${msg}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>`;
    $('#alerts').append(alertBox)
}

// when page loads
$( document ).ready(function() {
    // file upload indicator
    $("#loader").hide();


    // // add images to page
    loadImagesOnPage(); 

    $('.pagination').show()

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
            alertMessage("Error! maxium character limit is '"+ MAX_CHAR_LIMIT +"'.")
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
                alertMessage("Only image types such as [jpg| png| jfif] file types allowed")
            }
        }
    });

});
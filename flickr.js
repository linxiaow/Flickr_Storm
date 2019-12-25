var key = '29d4f375495a51d0768d7f580ccbfbd0';
var curDayAgo = 1;

var zero = 48; //beginning of event.which

var isGallery = false;

var current; // store current data for id.

var errorMessage = "Oops! No result found. Press 1 to go to today's set, 2 to go to previous set.";

$(document).ready(function() {
    $(window).keydown(keydownRouter);
    get_image(1); // flickr ajax call

    $('#Today').click(function(){
        var e = $.Event('keydown');
        e.which = zero + 1;
        $(window).trigger(e);
    });

    $('#Earlier').click(function(){
        var e = $.Event('keydown');
        e.which = zero + 3;
        $(window).trigger(e);
    });

    $('#Gallery').click(function(){
        var e = $.Event('keydown');
        e.which = zero + 5;
        $(window).trigger(e);
    });

    $('#GoBack').click(function(){
        var e = $.Event('keydown');
        e.which = zero + 2;
        $(window).trigger(e);
    });

    $('#Rotate').click(function(){
        var e = $.Event('keydown');
        e.which = zero + 9;
        $(window).trigger(e);
    });

    $('#Stop').click(function(){
        var e = $.Event('keydown');
        e.which = zero + 7;
        $(window).trigger(e);
    });
})

function keydownRouter(e){
    e.preventDefault();
    console.log(e.which - zero);
    switch (e.which - zero){
        case 1:
            //go back to today
            console.log("go back to today");
            get_image(1);
            break;

        case 2:
            //go back to previous interestingness
            console.log("go back to previous set");
            get_image(curDayAgo);
            break;
        case 3:
            //go to earlier interestingness
            console.log("go back to earlier set");
            get_image(curDayAgo + 1);
            break;
        case 5:
            console.log("Gallery view")
            if(!isGallery){
                get_gallery();
            }else{
                console.log("ignored!");
            }
            break;
        case 7:
            console.log("stop the rotate!");
            $("#myCarousel").carousel('pause');
            break;
        case 9:
            console.log("restart the rotate!");
            $("#myCarousel").carousel('cycle');
            break;
        default:
            console.log("Invalid Input!");
    }
}

function get_date(days_ago){
    let date = new Date();
    date.setDate(date.getDate() - days_ago);
    let year = date.getFullYear();
    let day = date.getDate();
    let month = date.getMonth() + 1; // 0 index
    if(day < 10){
        //1 -> 01
        day = '0' + day.toString();
    }
    
    let fulldate = year.toString() + '-' + month.toString() + '-' + day;

    console.log(fulldate);
    return fulldate;
}

function load_image(data, tag, isError){
    //if isError, load all UM picture
    // go through each photo in the json
    $('.item').remove();
    if(isError){
        var src = "UM.jpg";
        let imgHtml = $("<img/>").attr("src", src);
        let itemDivHtml = $("<div class='item" + " active" + "' width='460' height='345'/>").append(imgHtml);
        $(".carousel-inner").append(itemDivHtml);
    }else{
        $.each(data.photos.photo, function (i, photo) {
            if(i === 10){
                return;
            }
            var src = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + "_c.jpg";
    
            let active;
            if (i == 0)
             active = " active";
            else
                active = '';
    
    
            // Create the img html and set the src attribute to our URL
            let imgHtml = $("<img/>").attr("src", src);
    
            // Create the .item div and insert the img html into it
        // This is better done in css
            let itemDivHtml = $("<div class='item" + active + "' width='460' height='345'/>").append(imgHtml);
    
            // Insert the .item div into the .carousel-inner div
            $(".carousel-inner").append(itemDivHtml);
        })
    }
    //put the tag under the carousel
    let tagDivHtml = $("<div class='item text-center'><h3> "+tag+" </h2></div>");
    $(".container").append(tagDivHtml);
    $("#myCarousel").carousel('cycle');
}

function get_image(days_ago){
    // typically, yesterday
    isGallery = false;
    let theDay = get_date(days_ago); //
    let promise = new Promise(function(resolve, reject){
        $.ajax( {
            url: "https://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key="+ key +"&date="+theDay+"&per_page=10&format=json&nojsoncallback=1",
            type: 'GET',
            data: {},
        })
        .done(function(result) {
            console.log(result);
            if (result.stat === 'fail'){
                //still fail
                console.log("Error happens after the return of flickr api on " + theDay.toString());
                reject(Error("Cannot load image for " + theDay.toString()));
            }else{
                load_image(result, "Interestingness ("+theDay+")", false);
                resolve(result);
                // record
                curDayAgo = days_ago;
                
                current = result;
            }

        })
        .fail(function(error){
            console.log("fail to get the api data");
            reject(error);
        })
    })

    promise.then(function(result){
        console.log("Success on loading images from flickr...");
        console.log(result);
    }, function(error){
        console.log("Error happens ...");
        console.log(error);
        // load the error image
        load_image(error, errorMessage, true);
    });
}

function get_gallery(){
    isGallery = true;
    let curImage = $('#myCarousel .active')[0];
    //let idx = $('#myCarousel .active').index('#myCarousel .item');
    
    console.log(curImage);
    let imgList = $('#myCarousel .item').toArray();
    console.log(imgList);
    //let idx = curImage.index(imgList);
    let idx = imgList.indexOf(curImage);
    
    console.log("Index is " + idx);
    let p_id = current.photos.photo[idx].id;
    //get p_id

    let promise = new Promise(function(resolve, reject){
        $.ajax( {
            url: "https://api.flickr.com/services/rest/?method=flickr.galleries.getListForPhoto&api_key="+ key +"&photo_id=" + p_id + "&per_page=1&format=json&nojsoncallback=1",
            type: 'GET',
            data: {},
        })
        .done(function(data){
            console.log("Gallery Result");
            console.log(data);
            if(data.galleries.gallery.length === 0){
                console.log("No gallery is found");
                reject(data);
            }else{
                //get the first gallery
                let gallery_id = data.galleries.gallery[0].gallery_id;
                resolve(gallery_id);
            }
        })
        .fail(function(error){
            console.log("Fail to find a gallery during the API call");
            reject(error);
        })
    });

    promise.then(function(result){
        console.log("Success get gallries_id...");
        console.log(result);
        return result;
    })
    .then(function(gallery_id){
        $.ajax( {
            url: "https://api.flickr.com/services/rest/?method=flickr.galleries.getPhotos&api_key="+ key +"&gallery_id=" + gallery_id + "&per_page=10&format=json&nojsoncallback=1",
            type: 'GET',
            data: {},
        })
        .done(function(data) {
            console.log("successfully aquire images from galleries");
            
            load_image(data, "gallery view", false);
        })
        .fail(function(error) {
            console.log("Fail to aquire images from gallery");
            reject(error);
        });
    })
    .catch(function(error){
        console.log("Error happens ...");
        console.log(error);
        // load the error image
        load_image(error, errorMessage, true);
    })
}
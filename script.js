let apiKey = 'fD430FM8268SGoczkLpoeuMNN6Ah7aWvBWaYZRj5';


async function getAPOTD() {
    let imageContainer = document.getElementById('imageContainer');
    let copyright = document.getElementById('copyright');
    let response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
    let data = await response.json();
    let mediaType = data.media_type;
    console.log(data);
    console.log(mediaType);
    if (mediaType === 'video') {
        imageContainer.innerHTML += `<iframe src='${data.url}'  frameBorder="0"  allowFullScreen id='videoOfDay'></iframe>`;
    } else {
        imageContainer.innerHTML += `<img src='${data.url}' id='imageOfDay'>`;
    }
    copyright.innerHTML += `<h2 id = 'authorName' > ${ data.title }</h2><p id='textOfDay'>${data.explanation}</p > <p id ='date' > ${ data.date } </p>`;
}

let marswe = document.getElementById('earthArticle');
let kk = document.getElementById('marsIframe');
let container = document.getElementById('container')
let marsWeather = document.getElementById('marsWeather')
marswe.addEventListener('click', () => {

    marsWeather.style.display = 'block';
    container.style.filter = 'blur(5px)';

})




window.onload = getAPOTD();
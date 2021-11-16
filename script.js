const apiKey = "fD430FM8268SGoczkLpoeuMNN6Ah7aWvBWaYZRj5";

const getAPOTD = async () => {
  await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`)
    .then((res) => {
      return res.json();
    })
    .then((dataAPOTD) => {
      const imageContainer = document.getElementById("imageContainer");
      const copyright = document.getElementById("copyright");
      if (dataAPOTD.media_type === "video") {
        imageContainer.innerHTML += `<iframe src='${dataAPOTD.url}'  frameBorder="0"  allowFullScreen id='videoOfDay'></iframe>`;
      } else {
        imageContainer.innerHTML += `<img src='${dataAPOTD.url}' id='imageOfDay'>`;
      }
      copyright.innerHTML += `<h2 id = 'authorName' > ${dataAPOTD.title}</h2><p id='textOfDay'>${dataAPOTD.explanation}</p > <p id ='date' > ${dataAPOTD.date} </p>`;
    });
};

getAPOTD();
let neoArticle = document.getElementById("neoArticle");
let divNEO = document.getElementById("neo");

const getNEO = async () => {
  let currentDate = new Date();
  let date =
    currentDate.getFullYear() +
    "-" +
    (currentDate.getMonth() + 1) +
    "-" +
    currentDate.getDate();
  await fetch(
    `https://api.nasa.gov/neo/rest/v1/feed?start_date=${date}&api_key=${apiKey}`
  )
    .then((res) => {
      return res.json();
    })
    .then((dataNeo) => {
      const elementCount = dataNeo.element_count;
      const neo = dataNeo.near_earth_objects;
      const valuesNEO = Object.values(neo);
      Object.keys(neo).forEach((items) => {
        divNEO.innerHTML += `<div class="dropdown">
                                    <button onclick="myFunction()" class="dropbtn id='hola'">
                                        ${items}
                                    </button>
                                    <div id="myDropdown" class="dropdown-content">
                                    </div>
                                </div>`;
      })
        
      const y = getElementById('hola')
      let x = -1;
      let xxx = 0;
      for (let i = 0; i < valuesNEO.length;  i++) {
        let xx = 0;
        x++
        for (let ii = 0; ii < valuesNEO[x].length; ii++) {
          hola.innerHTML += `<il>${valuesNEO[x][xx]}</il>`
          console.log(valuesNEO[x][xx].name);
          xx++

        }
        }
    });
};
getNEO();

let marsArticle = document.getElementById("marsArticle");
let container = document.getElementById("container");
let marsWeather = document.getElementById("marsWeather");
let marsIframe = document.getElementById("marsIframe");
marsArticle.addEventListener("click", () => {
  marsWeather.style.display = "block";
  marsWeather.innerHTML +=
    "<iframe src='https://mars.nasa.gov/layout/embed/image/mslweather/' width='800' height='530' scrolling='no' frameborder='0' id='marsIframe'></iframe>";
  container.style.filter = "blur(5px)";
});

neoArticle.addEventListener("click", () => {
  divNEO.style.display = "inline-grid";
  container.style.filter = "blur(5px)";
});

/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {
  if (!event.target.matches(".dropbtn")) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};

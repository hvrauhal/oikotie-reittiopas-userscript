// ==UserScript==
// @name        oikotie-reittiopas-to-location
// @namespace   my-oikotie-api.herokuapp.com
// @description Shows the reittiopas route to the on sale apartments
// @include     http://asunnot.oikotie.fi/myytavat-asunnot*
// @version     1.1
// @grant       GM_getValue
// @grant       GM_setValue
// @license     The MIT License (MIT); http://opensource.org/licenses/MIT
// ==/UserScript==

let locationApiPrefix =  "http://my-oikotie-api.herokuapp.com/hsl/prod/?request=geocode&format=json&key=";
let routeApiPrefix =  "http://my-oikotie-api.herokuapp.com/hsl/prod/?request=route&format=json&request=route&time=0900&timetype=arrival";

insertUi()

function insertUi() {
  let routeDiv = document.createElement('div');
  let routeTargetInput = document.createElement('input');
  routeTargetInput.type = "text";
  routeTargetInput.style.width = "300px";
  routeTargetInput.placeholder = "Matka-aikahaun kohdeosoite";
  routeTargetInput.value = GM_getValue("toAddress") || "";
  routeTargetInput.id = "routeInfoTargetAddress";
  routeTargetInput.oninput = (e) => { GM_setValue("toAddress", e.target.value)}

  let amendButton = document.createElement('button');
  amendButton.id = "routeInfoAmendButton";
  amendButton.textContent = "Näytä matka-ajat reittioppaan mukaan";
  amendButton.onclick = amendCardsWithRouteInfo;
  amendButton.style.cursor = "pointer";
  routeDiv.appendChild(routeTargetInput);
  routeDiv.appendChild(amendButton);

  let controlElem = document.querySelector('#search-views .controls');
  controlElem.style.height = "45px";
  controlElem.appendChild(routeDiv);
}


function amendCardsWithRouteInfo() {
  var ongoingAmends = 0;
  let amendButton = document.querySelector("#routeInfoAmendButton");
  let addressInput = document.querySelector('#routeInfoTargetAddress')
  amendButton.setAttribute("disabled","true");
  addressInput.setAttribute("disabled","true");
  let address = addressInput.value;
  getJson(locationApiPrefix + address).then((location) => {
    let firstLocation = location[0];
    let location = {
      address: firstLocation.name + " " + (firstLocation.details && firstLocation.details.houseNumber || "")  + ",  " + firstLocation.city,
      coords: firstLocation.coords 
    };
    for (let elem of document.querySelectorAll(".cards .content")) {
      ongoingAmends = ongoingAmends + 1;
      let doneFn = () => {
        ongoingAmends = ongoingAmends - 1;
        if (ongoingAmends === 0) {
          amendButton.removeAttribute("disabled");
          addressInput.removeAttribute("disabled");
        }
      }
      amendWithRouteInfo(elem, location).then(doneFn).then(null, (e) => { console.error("caught", e); doneFn()});
    }
  })
}

function amendWithRouteInfo(elem, to) {
  let cardAddress = (elem.querySelector(".address") && (elem.querySelector(".address").textContent + ', ') || "")  +
    (elem.querySelector(".district") && elem.querySelector(".district").textContent.match(/,(.*)/)[1].trim() || "");
  if (!cardAddress) return Promise.resolve("No card address");
  let fromCoordsP = getJson(locationApiPrefix + cardAddress).then(locationRes => locationRes[0].coords);
  let routeP = fromCoordsP.then(fromCoords => {
    return getJson(routeApiPrefix + "&from=" + fromCoords + "&to=" + to.coords)
      .then((routeResponse) => {
        return {route:routeResponse, fromCoords: fromCoords, toCoords : to.coords, toAddress: to.address};
      })
  });
  return routeP.then((routeDetails) => {
    let aElem = document.createElement("a"); 
    aElem.href="http://reittiopas.fi/?from=" + routeDetails.fromCoords + "&to=" + routeDetails.toCoords;
    aElem.textContent = (parseInt(routeDetails.route[0][0].duration, 10) / 60) + " min " + routeDetails.toAddress;
    aElem.style.display = "inline-block";
    aElem.style.background = "white";
    elem.querySelector(".price-extra").appendChild(aElem);
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    let req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onload = () => {
      if (req.status < 300) {
        resolve(req.response);
      } else {
        reject(Error(req.statusText + " from url: " + url));
      }
    };
    req.onerror = () => {
      reject(Error("Network Error"));
    };
    req.send();
  });
}

function getJson(url) {
    return get(url).then(r => JSON.parse(r));
}


// The MIT License (MIT)
//
// Copyright (c) 2014 Heikki Rauhala
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//



// ==UserScript==
// @name         hn faves
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  custom script for hn faves
// @author       throwaway1245725
// @homepage     https://github.com/throwaway1245725/hn-faves/
// @match        https://hentainexus.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hentainexus.com
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function () {
  "use strict";

  const FAVORITED_URL =
    "https://github.com/throwaway1245725/holy-shit/raw/main/hn/favorited.json";
  const HEART = `<svg class="svg-inline--fa fa-heart" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="heart" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="rgb(255 172 51)" d="M0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84.02L256 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 .0003 232.4 .0003 190.9L0 190.9z"></path></svg>`;

  let allFaveUrls = [];
  let allArtists = [];
  let cards = [];

  const cleanArtistName = (artistName) => {
    return decodeURI(artistName.toLowerCase())
      .replace("+", " ")
      .replace(/[^a-zA-Z0-9-]/g, "");
  };

  const loadData = (response) => {
    const favoritedData = JSON.parse(response.responseText);
    allFaveUrls = Object.keys(favoritedData);
    allArtists = [
      ...new Set(
        Object.values(favoritedData).map((f) => f.replace(/\/.*/, ""))
      ),
    ].map((a) => cleanArtistName(a));
  };

  const decorateImg = (img) => {
    img.style.borderWidth = "4px";
    img.style.borderStyle = "solid";
    img.style.borderColor = "rgb(255 172 51)";
  };

  const decorateHeart = (targetEl) => {
    const heartDiv = document.createElement("div");
    heartDiv.classList.add("card-header-icon");
    heartDiv.classList.add("list-star-icon");
    heartDiv.ariaLabel = "Favorite";
    const span = document.createElement("span");
    span.classList.add("icon");
    const svg = document.createElement("svg");
    svg.innerHTML = HEART;
    span.appendChild(svg);
    heartDiv.appendChild(span);
    targetEl.appendChild(heartDiv);
  };

  const decorateCard = (card) => {
    decorateImg(card.querySelector("img"));
    decorateHeart(card.querySelector("header"));
  };

  const tagFaveArtists = (links) => {
    links
      .filter((a) => {
        const m = a.href.match(
          /https:\/\/.*\/\?q=artist:(?:%22)?(.*?)(?:%22)?$/
        );
        return m && allArtists.includes(cleanArtistName(m[1]));
      })
      .forEach((a) => {
        a.style.setProperty("color", "rgb(255 171 49)", "important");
        a.style.backgroundColor = "rgb(26 26 26)";
      });
  };

  const tagGalleries = () => {
    cards = Array.from(document.querySelectorAll("a[href^='/view/'] > .card"));
    for (const card of cards) {
      GM.xmlHttpRequest({
        method: "GET",
        url: card.parentElement.href,
        onload: fetchArtists,
      });
    }
    const faves = cards.filter((f) =>
      allFaveUrls.includes(f.parentElement.href)
    );
    for (const fave of faves) {
      decorateCard(fave);
    }
  };

  const tagArtists = () => {
    const links = Array.from(
      document.querySelectorAll("a[href*='/?q=artist:']")
    );
    tagFaveArtists(links);
  };

  const tagGallery = () => {
    if (allFaveUrls.includes(window.location.href)) {
      const favBtn = document.querySelector("a.star-button");
      favBtn.style.opacity = 0.5;
      favBtn.style.pointerEvents = "none";
      decorateImg(document.querySelector(".is-one-third-desktop img"));
    }
  };

  const tagStuff = () => {
    tagGalleries();
    tagArtists();
    tagGallery();
  };

  const fetchArtists = async (response) => {
    const links = Array.from(
      response.responseXML.querySelectorAll(
        "table.view-page-details a[href^='/?q=artist:']"
      )
    );
    const pageCount = response.responseXML.querySelectorAll(
      "div.box div.columns.is-multiline a[href^='/read/']"
    ).length;
    if (links.length > 0) {
      tagFaveArtists(
        links.map((a) => {
          const card = cards.find(
            (c) => c.parentElement.href === response.finalUrl
          );
          const header = card.querySelector("header");
          const pageCountDiv = document.createElement("div");
          pageCountDiv.textContent = pageCount;
          pageCountDiv.style.position = "absolute";
          pageCountDiv.style.bottom = "10px";
          pageCountDiv.style.right = "10px";
          pageCountDiv.style.zIndex = 1;
          pageCountDiv.style.paddingInline = "6px";
          pageCountDiv.style.paddingBlock = "3px";
          pageCountDiv.style.borderRadius = "5px";
          pageCountDiv.style.color = "rgb(223 223 223)";
          pageCountDiv.style.backgroundColor = "rgb(0 0 0 / 75%)";
          pageCountDiv.style.fontWeight = "bold";
          header.after(pageCountDiv);
          a.style.padding = "10px";
          a.style.lineHeight = "38px";
          a.style.setProperty("color", "rgb(183 183 183)", "important");
          header.after(a);
          return a;
        })
      );
    }
  };

  const fetchFaves = async (response) => {
    loadData(response);
    tagStuff();
  };

  GM.xmlHttpRequest({
    method: "GET",
    url: FAVORITED_URL,
    onload: fetchFaves,
  });
})();

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

  const INDEX_URL =
    "https://github.com/throwaway1245725/holy-shit/raw/main/index.json";
  const STAR =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAMAAABiM0N1AAAAM1BMVEVHcEz/rDP/rDP/rDP/rDP/rDP/rDP/rDP/rDP/rDP/rDP/rDP/rDP/rDP/rDP/rDP/rDPIzIGKAAAAEXRSTlMAMK/v/78gcM8QYFDfgECfjzPxc0MAAAFZSURBVHgB7djVYsUwCIBhEoin8v4vO2WeM0jpfN/t0Z+mCif45zyid2DmkG6gA6tAdwIYRWIRbBKxBDaZWLaXsWguY8lcxoK9jBVzGavmMubtZayYy1g1lzFvL2PFXMaquYx5exkr5jJWzWXM28tUba2TSW/8PWTW4FYnsw43Cp2gnPVFp6WdO2xoSCbYgBVPBr7Ak4R0ECZ4wWU6JDt4baEDFhhYO03qKwwVb5gyYw3nN/pYDKQUoniAVUkgclm90QXFq6cskL8IVAqJCmhUElXQ2Ei0gQaSCEGhkULTl9nbuvZoL3Ck4kCyk8oOkkwqGQSRlA4cRTAlnD+O5OEhw+XZtnJpqvvkjlsvHpjX13l15lAUCjwqYeagNB7oeEOod9js3j+cN+Wy3gu8UXbl4g7i6a+hakjp1ZQHStAsyYj8HsXixyg+5MlOcQrt0oFkTSuI1rrCt3cNofAlUpDr+CkAAAAASUVORK5CYII=";

  const waitForEl = (selector) =>
    new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });

  const waitForNotEl = (selector) =>
    new Promise((resolve) => {
      if (!document.querySelector(selector)) {
        return resolve();
      }

      const observer = new MutationObserver(() => {
        if (!document.querySelector(selector)) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });

  const movePreviewBtn = () => {
    try {
      const showAllBtn = document.querySelector(
        "#previews footer button:nth-of-type(2)"
      );
      if (showAllBtn) {
        showAllBtn.style.backgroundColor = "#0f4d8a";
        showAllBtn.style.borderRadius = ".5rem";
        showAllBtn.style.fontWeight = 500;
        showAllBtn.style.letterSpacing = ".05rem";
        showAllBtn.style.padding = "1rem";
        showAllBtn.style.textTransform = "uppercase";
        showAllBtn.style.marginBottom = "1rem";
        showAllBtn.style.width = "100%";
        showAllBtn.onclick = () =>
          document.querySelector("#previews").removeChild(showAllBtn);
        document.querySelector("#previews").prepend(showAllBtn);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cleanArtistName = (artistName) => {
    return decodeURI(artistName.toLowerCase())
      .replace("+", " ")
      .replace(/[^a-zA-Z0-9-]/g, "");
  };

  const loadData = (response) => {
    const indexData = JSON.parse(response.responseText);
    const allFaveUrls = Object.values(indexData).flatMap((a) =>
      Object.values(a)
    );
    const allArtists = Object.keys(indexData).map((a) => cleanArtistName(a));

    return [allFaveUrls, allArtists];
  };

  const decorateImg = (img) => {
    img.style.borderWidth = "4px";
    img.style.borderStyle = "solid";
    img.style.borderColor = "rgb(255 172 51)";
    const starDiv = document.createElement("img");
    starDiv.src = STAR;
    starDiv.style.width = "50px";
    starDiv.style.minWidth = "50px";
    starDiv.style.height = "50px";
    starDiv.style.minHeight = "50px";
    starDiv.style.marginTop = "8px";
    starDiv.style.marginLeft = "-60px";
    starDiv.style.position = "absolute";
    img.after(starDiv);
  };

  const tagGalleries = (allFaveUrls, allArtists) => {
    const articles = Array.from(document.querySelectorAll("#main article"));
    for (const article of articles) {
      tagGalleryArtists(article, allArtists);
    }
    const faves = articles.filter((f) =>
      allFaveUrls.includes(f.querySelector("a.overlay").href)
    );
    for (const fave of faves) {
      const img = fave.querySelector("img");
      decorateImg(img);
    }
  };

  const tagArtists = (allArtists) => {
    const links = Array.from(
      document.querySelectorAll("#main a[href*='/?s=artist:']")
    );
    links
      .filter((a) => {
        const m = a.href.match(
          /https:\/\/.*\/\?s=artist:(?:%22)?\^(.*)\$(?:%22)?/
        );
        return m && allArtists.includes(cleanArtistName(m[1]));
      })
      .forEach((a) => {
        a.style.color = "rgb(255 171 49)";
      });
  };

  const tagGallery = (allFaveUrls, allArtists) => {
    if (allFaveUrls.includes(window.location.href)) {
      const favBtn = document.querySelector(
        "#main > #gallery aside #actions > button.fav"
      );
      favBtn.style.opacity = 0.5;
      favBtn.style.pointerEvents = "none";
      const img = document.querySelector("#main > #gallery aside figure img");
      decorateImg(img);
    }
    const galleryMetadata = document.getElementById("metadata");
    if (galleryMetadata) {
      tagGalleryArtists(galleryMetadata, allArtists);
    }
  };

  const tagGalleryArtists = (parent, allArtists) => {
    const artists = Array.from(
      parent.querySelectorAll("div a[data-namespace='1'][href*='/?s=artist:']")
    );
    if (artists.length > 0) {
      artists
        .filter((a) => {
          const m = a.href.match(
            /https:\/\/.*\/\?s=artist:(?:%22)?\^(.*)\$(?:%22)?/
          );
          return m && allArtists.includes(cleanArtistName(m[1]));
        })
        .forEach((a) => {
          a.style.color = "rgb(255 171 49)";
          a.style.backgroundColor = "rgb(73 27 0)";
        });
    }
  };

  const tagStuff = (allFaveUrls, allArtists) => {
    tagGalleries(allFaveUrls, allArtists);

    tagArtists(allArtists);

    tagGallery(allFaveUrls, allArtists);
  };

  const fetchFaves = async (response) => {
    const MAIN_CSS_SELECTOR = "#main > :is(section, article):has(main)";
    const LOADING_CSS_SELECTOR =
      "#main > :is(section, article) main:has(.loading)";
    const [allFaveUrls, allArtists] = loadData(response);
    const mainObserver = new MutationObserver(() =>
      tagStuff(allFaveUrls, allArtists)
    );
    let mainEl = await waitForEl(MAIN_CSS_SELECTOR);
    tagStuff(allFaveUrls, allArtists);
    mainObserver.observe(mainEl, { childList: true });
    const rootObserver = new MutationObserver(async () => {
      if (
        !document.body.contains(mainEl) ||
        !document.querySelector(MAIN_CSS_SELECTOR)
      ) {
        mainObserver.disconnect();
        mainEl = await waitForEl(MAIN_CSS_SELECTOR);
        if (document.querySelector(LOADING_CSS_SELECTOR)) {
          await waitForNotEl(LOADING_CSS_SELECTOR);
          mainEl = await waitForEl(MAIN_CSS_SELECTOR);
        }
        tagStuff(allFaveUrls, allArtists);
        mainObserver.observe(mainEl, { childList: true });
      }
    });
    rootObserver.observe(document.querySelector("#root"), {
      childList: true,
      subtree: true,
    });
  };

  movePreviewBtn();
  setInterval(movePreviewBtn, 1000);
  GM.xmlHttpRequest({
    method: "GET",
    url: INDEX_URL,
    onload: fetchFaves,
  });
})();

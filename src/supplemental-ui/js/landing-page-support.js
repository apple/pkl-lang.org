// ===----------------------------------------------------------------------===//
// Copyright © 2024 Apple Inc. and the Pkl project authors. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===----------------------------------------------------------------------===//
(function() {
  window.addEventListener("load", () => {
    const navbar = document.getElementsByClassName("navbar")[0];
    const handleScroll = () => {
      let className = navbar.className;
      if (window.scrollY === 0 && className === "navbar") {
        navbar.setAttribute("class", "navbar navbar-top")
      } else if (window.scrollY > 0 && className === "navbar navbar-top") {
        navbar.setAttribute("class", "navbar");
      }
    }
    window.addEventListener("scroll", handleScroll);
    handleScroll()
  });
})();
// Landing page breaks all Anotra UI JS, include the burger button, because it doesn't have a nav item which causes
// site.js to throw and exit before it's had time to set up any handlers.
// Adding a second copy of the burger JS just for the home page will at least ensure people can see and navigate
// links from the landing page on mobile devices.
(function () {
  'use strict'

  var navbarBurger = document.querySelector('.navbar-burger')
  if (!navbarBurger) return
  navbarBurger.addEventListener('click', toggleNavbarMenu.bind(navbarBurger))

  function toggleNavbarMenu (e) {
    e.stopPropagation() // trap event
    document.classList.toggle('is-clipped--navbar')
    navbarBurger.setAttribute('aria-expanded', document.classList.contains('is-clipped--navbar'))
    var menu = document.getElementById("topbar-nav")
    if (menu.classList.toggle('is-active')) {
      menu.style.maxHeight = ''
      var expectedMaxHeight = window.innerHeight - Math.round(menu.getBoundingClientRect().top)
      var actualMaxHeight = parseInt(window.getComputedStyle(menu).maxHeight, 10)
      if (actualMaxHeight !== expectedMaxHeight) menu.style.maxHeight = expectedMaxHeight + 'px'
    }
  }
})();

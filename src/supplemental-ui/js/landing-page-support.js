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

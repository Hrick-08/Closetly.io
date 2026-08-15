document.addEventListener("DOMContentLoaded", () => {
  const pages = document.querySelectorAll(".page");
  const navItems = document.querySelectorAll(".nav-item");
  const pageButtons = document.querySelectorAll("[data-page]");

  function showPage(pageId) {
    pages.forEach((page) => {
      page.classList.toggle("active-page", page.id === pageId);
    });

    navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.page === pageId);
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    // Close Bootstrap mobile navbar after navigation.
    const navCollapse = document.getElementById("mainNav");
    if (navCollapse && navCollapse.classList.contains("show")) {
      const collapse = bootstrap.Collapse.getInstance(navCollapse);
      if (collapse) collapse.hide();
    }
  }

  pageButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      const target = button.dataset.page;
      if (target) showPage(target);
    });
  });
x
  // Start on Home.
  showPage("home");
});
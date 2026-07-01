const BDLAB_IMAGES = {
  logo: "./assets/images/common/bdlab-logo.png",

  homeHero: "./assets/images/home/hero-01.jpg",
  homeAbout: "./assets/images/home/about-01.jpg",
  homeProcess: "./assets/images/home/process-01.jpg",

  archiveDefault: "./assets/images/archive/terracle-01.jpg",

  terracle: "./assets/images/archive/terracle-01.jpg",
  masitta: "./assets/images/archive/masitta-01.jpg",
  kekomi: "./assets/images/archive/kekomi-01.jpg",
  odebell: "./assets/images/archive/odebell-01.jpg",

  journal01: "./assets/images/journal/journal-01.jpg",
  journal02: "./assets/images/journal/journal-02.jpg"
};

// 기본 이미지 삽입
document.querySelectorAll("[data-img-key]").forEach((image) => {
  const key = image.dataset.imgKey;
  const src = BDLAB_IMAGES[key];

  if (src) {
    image.src = src;
  }
});

// Archive hover preview
const archivePreview = document.getElementById("archivePreviewImage");
const projectItems = document.querySelectorAll("[data-preview-key]");

projectItems.forEach((item) => {
  item.addEventListener("mouseenter", () => {
    const key = item.dataset.previewKey;
    const src = BDLAB_IMAGES[key];

    if (archivePreview && src) {
      archivePreview.src = src;
    }
  });
});

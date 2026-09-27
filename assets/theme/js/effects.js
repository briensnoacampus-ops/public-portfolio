// effects.js

document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  let event = null;

  if (month === 10 && day >= 20 && day <= 31) event = "halloween";
  else if (month === 12 && day >= 1 && day <= 26) event = "noel";
  else if (month === 12 && day >= 29 || (month === 1 && day <= 3)) event = "nouvelAn";

  if (!event) return;

  const container = document.createElement("div");
  container.className = "seasonal-effect";
  document.body.appendChild(container);

  function createFallingElement() {
    const el = document.createElement("img");
    el.style.position = "fixed";
    el.style.pointerEvents = "none";
    el.style.zIndex = "9999";
    el.style.top = "-50px";
    el.style.left = Math.random() * window.innerWidth + "px";
    el.style.width = "32px";
    el.style.height = "32px";
    el.style.opacity = Math.random() * 0.8 + 0.2;
    el.style.transition = "transform 10s linear, top 10s linear, opacity 10s linear";

    if (event === "halloween") {
      const pumpkins = [
        "assets/images/pumpkin1.png",
        "assets/images/pumpkin2.png",
        "assets/images/pumpkin3.png",
        "assets/images/pumpkin4.png"
      ];
      el.src = pumpkins[Math.floor(Math.random() * pumpkins.length)];
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
    }

    if (event === "noel") {
      const snow = ["assets/images/snowflake1.png", "assets/images/snowflake2.png"];
      el.src = snow[Math.floor(Math.random() * snow.length)];
    }

    if (event === "nouvelAn") {
      const confettis = [
        "assets/images/confetti1.png",
        "assets/images/confetti2.png",
        "assets/images/confetti3.png",
        "assets/images/confetti4.png",
        "assets/images/confetti5.png",
        "assets/images/confetti6.png"
      ];
      el.src = confettis[Math.floor(Math.random() * confettis.length)];
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
    }

    container.appendChild(el);

    const fallDuration = 10000 + Math.random() * 5000;
    const rotation = Math.random() * 720 - 360;

    requestAnimationFrame(() => {
      el.style.top = window.innerHeight + "px";
      el.style.transform = `rotate(${rotation}deg)`;
      el.style.opacity = "0";
    });

    setTimeout(() => el.remove(), fallDuration);
  }

  setInterval(createFallingElement, 1500);
});

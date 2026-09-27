(function() {
  // ---  Définition des saisons ---
  const SEASONS = {
    normal: {
      intro: null,
      sounds: [
        'assets/sounds/ButtonSound1.wav',
        'assets/sounds/ButtonSound2.wav',
        'assets/sounds/ButtonSound3.wav',
        'assets/sounds/ButtonSound4.wav',
        'assets/sounds/ButtonSound5.wav'
      ],
      mascottes: [
        'assets/images/3dgifmaker96286.gif',
        'assets/images/3dgifmaker01912.gif',
        'assets/images/3dgifmaker49169.gif',
        'assets/images/3dgifmaker80879.gif',
        'assets/images/3dgifmaker54979.gif'
      ],
      music: [
        'assets/sounds/MétaveBgAudio2.mp3',
        'assets/sounds/MétaveBgAudio1.mp3'
      ]
    },

    halloween: {
      intro: 'assets/sounds/halloween_intro.wav',
      sounds: [
        'assets/sounds/ButtonSound1.wav',
        'assets/sounds/ButtonSound2.wav',
        'assets/sounds/halloween_click1.wav',
        'assets/sounds/halloween_click2.wav',
        'assets/sounds/halloween_click3.wav'
      ],
      mascottes: [
        'assets/images/3dgifmaker14761.gif',
        'assets/images/3dgifmaker18968.gif'
      ],
      
      music: [
        'assets/sounds/halloween_bg1.wav'
      ]
    },

    noel: {
      intro: 'assets/sounds/noel_intro.wav',
      sounds: [
        'assets/sounds/ButtonSound1.wav',
        'assets/sounds/ButtonSound2.wav',
        'assets/sounds/ButtonSound3.wav',
        'assets/sounds/noel_click1.wav'
        
      ],
      mascottes: [
        'assets/images/3dgifmaker07840.gif',
        'assets/images/3dgifmaker40998.gif'
      ],
      
      music: [
        'assets/sounds/noel_bg1.wav'
      ]
    },

    nouvelan: {
      intro: null,
      sounds: [
        'assets/sounds/ButtonSound1.wav',
        'assets/sounds/ButtonSound2.wav',
        'assets/sounds/ButtonSound3.wav',
        'assets/sounds/newyear_click1.wav'
        
      ],
      mascottes: [
        'assets/images/3dgifmaker57482.gif',
        'assets/images/3dgifmaker39625.gif'
      ],
      music: [
        'assets/sounds/MétaveBgAudio2.mp3',
        'assets/sounds/MétaveBgAudio1.mp3'
      ]
    },
  };

  // ---  Détection automatique de la saison ---
  function getSeason() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    if (month === 10 && day >= 24) return 'halloween';
    if (month === 12 && day >= 15 && day <= 26) return 'noel';
    if (month === 1 && day <= 2) return 'nouvelan';
    return 'normal';
  }

  const currentSeason = getSeason();
  const season = SEASONS[currentSeason];

  console.log(`🎉 Thème actuel : ${currentSeason}`);

  // ---  Injection des sons de boutons ---
  window.SOUNDS = season.sounds;

  // ---  Injection des mascottes ---
  window.MASCOTTE_IMAGES = season.mascottes;

  

  // --- ⏯ Audio de fond ---
  const audio = document.getElementById('bg-music'); // assure-toi que <audio id="bg-music"></audio> existe

  function playWithFade(src, volumeMax = 0.02, loop = false, callback) {
    audio.src = src;
    audio.loop = loop;
    audio.volume = 0;
    audio.play().catch(() => {});
    let vol = 0;
    const interval = setInterval(() => {
      vol += 0.001; // très lent et discret
      if (vol >= volumeMax) {
        vol = volumeMax;
        clearInterval(interval);
      }
      audio.volume = vol;
    }, 100);

    if (callback && !loop) {
      audio.onended = () => {
        callback();
        audio.onended = null;
      };
    }
  }

  // --- ⏯ Premier clic sur la page ---
  function handleFirstClick() {
    if (season.intro) {
      // joue l'intro puis la boucle
      playWithFade(season.intro, 0.002, false, () => {
        const loopMusic = season.music[Math.floor(Math.random() * season.music.length)];
        playWithFade(loopMusic, 0.02, true);
      });
    } else {
      const loopMusic = season.music[Math.floor(Math.random() * season.music.length)];
      playWithFade(loopMusic, 0.02, true);
    }
    document.removeEventListener('click', handleFirstClick);
  }

  document.addEventListener('click', handleFirstClick);
})();

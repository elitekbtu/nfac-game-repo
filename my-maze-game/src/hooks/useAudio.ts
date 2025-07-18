import { useEffect, useRef, useState } from 'react';

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  transitionSound: HTMLAudioElement | null;
  coolerSound: HTMLAudioElement | null;
  toiletSound: HTMLAudioElement | null;
  victorySound: HTMLAudioElement | null;
  medkitSound: HTMLAudioElement | null;
  launchSound: HTMLAudioElement | null;
  isBackgroundPlaying: boolean;
  isTransitionPlaying: boolean;
  isCoolerPlaying: boolean;
  isToiletPlaying: boolean;
  isVictoryPlaying: boolean;
  isMedkitPlaying: boolean;
  isLaunchPlaying: boolean;
}

export const useAudio = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    backgroundMusic: null,
    transitionSound: null,
    coolerSound: null,
    toiletSound: null,
    victorySound: null,
    medkitSound: null,
    launchSound: null,
    isBackgroundPlaying: false,
    isTransitionPlaying: false,
    isCoolerPlaying: false,
    isToiletPlaying: false,
    isVictoryPlaying: false,
    isMedkitPlaying: false,
    isLaunchPlaying: false,
  });

  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const transitionSoundRef = useRef<HTMLAudioElement | null>(null);
  const coolerSoundRef = useRef<HTMLAudioElement | null>(null);
  const toiletSoundRef = useRef<HTMLAudioElement | null>(null);
  const victorySoundRef = useRef<HTMLAudioElement | null>(null);
  const medkitSoundRef = useRef<HTMLAudioElement | null>(null);
  const launchSoundRef = useRef<HTMLAudioElement | null>(null);

  // Инициализация звуков
  useEffect(() => {
    // Создаем элемент для фоновой музыки
    const bgMusic = new Audio('/music/sound.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    backgroundMusicRef.current = bgMusic;

    // Создаем элемент для звука перехода
    const transitionSound = new Audio('/music/earthquake.mp3');
    transitionSound.volume = 0.5;
    transitionSoundRef.current = transitionSound;

    // Создаем элемент для звука кулера
    const coolerSound = new Audio('/music/cooler.mp3');
    coolerSound.volume = 0.4;
    coolerSoundRef.current = coolerSound;

    // Создаем элемент для звука туалета
    const toiletSound = new Audio('/music/toilet.mp3');
    toiletSound.volume = 0.4;
    toiletSoundRef.current = toiletSound;

    // Создаем элемент для звука победы
    const victorySound = new Audio('/music/victory.mp3');
    victorySound.volume = 0.6;
    victorySoundRef.current = victorySound;

    // Создаем элемент для звука аптечки
    const medkitSound = new Audio('/sounds/confirm.wav');
    medkitSound.volume = 0.5;
    medkitSoundRef.current = medkitSound;

    // Создаем элемент для звука запуска
    const launchSound = new Audio('/music/launch.mp3');
    launchSound.volume = 0.6;
    launchSoundRef.current = launchSound;

    setAudioState({
      backgroundMusic: bgMusic,
      transitionSound: transitionSound,
      coolerSound: coolerSound,
      toiletSound: toiletSound,
      victorySound: victorySound,
      medkitSound: medkitSound,
      launchSound: launchSound,
      isBackgroundPlaying: false,
      isTransitionPlaying: false,
      isCoolerPlaying: false,
      isToiletPlaying: false,
      isVictoryPlaying: false,
      isMedkitPlaying: false,
      isLaunchPlaying: false,
    });

    // Очистка при размонтировании
    return () => {
      if (bgMusic) {
        bgMusic.pause();
        bgMusic.src = '';
      }
      if (transitionSound) {
        transitionSound.pause();
        transitionSound.src = '';
      }
      if (coolerSound) {
        coolerSound.pause();
        coolerSound.src = '';
      }
      if (toiletSound) {
        toiletSound.pause();
        toiletSound.src = '';
      }
      if (victorySound) {
        victorySound.pause();
        victorySound.src = '';
      }
      if (medkitSound) {
        medkitSound.pause();
        medkitSound.src = '';
      }
      if (launchSound) {
        launchSound.pause();
        launchSound.src = '';
      }
    };
  }, []);

  // Функция для запуска фоновой музыки
  const startBackgroundMusic = async () => {
    if (backgroundMusicRef.current && !audioState.isBackgroundPlaying) {
      try {
        await backgroundMusicRef.current.play();
        setAudioState(prev => ({ ...prev, isBackgroundPlaying: true }));
      } catch (error) {
        console.error('Ошибка воспроизведения фоновой музыки:', error);
      }
    }
  };

  // Функция для остановки фоновой музыки
  const stopBackgroundMusic = () => {
    if (backgroundMusicRef.current && audioState.isBackgroundPlaying) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
      setAudioState(prev => ({ ...prev, isBackgroundPlaying: false }));
    }
  };

  // Функция для воспроизведения звука перехода
  const playTransitionSound = async () => {
    if (transitionSoundRef.current && !audioState.isTransitionPlaying) {
      try {
        // Останавливаем фоновую музыку на время перехода
        if (backgroundMusicRef.current && audioState.isBackgroundPlaying) {
          backgroundMusicRef.current.pause();
        }

        // Воспроизводим звук перехода
        transitionSoundRef.current.currentTime = 0;
        await transitionSoundRef.current.play();
        setAudioState(prev => ({ ...prev, isTransitionPlaying: true }));

        // Возвращаем фоновую музыку после окончания звука перехода
        transitionSoundRef.current.onended = () => {
          setAudioState(prev => ({ ...prev, isTransitionPlaying: false }));
          if (backgroundMusicRef.current) {
            backgroundMusicRef.current.play();
          }
        };
      } catch (error) {
        console.error('Ошибка воспроизведения звука перехода:', error);
        // В случае ошибки возвращаем фоновую музыку
        if (backgroundMusicRef.current) {
          backgroundMusicRef.current.play();
        }
      }
    }
  };

  // Функция для воспроизведения звука кулера
  const playCoolerSound = async () => {
    if (coolerSoundRef.current && !audioState.isCoolerPlaying) {
      try {
        coolerSoundRef.current.currentTime = 0;
        await coolerSoundRef.current.play();
        setAudioState(prev => ({ ...prev, isCoolerPlaying: true }));

        coolerSoundRef.current.onended = () => {
          setAudioState(prev => ({ ...prev, isCoolerPlaying: false }));
        };
      } catch (error) {
        console.error('Ошибка воспроизведения звука кулера:', error);
      }
    }
  };

  // Функция для воспроизведения звука туалета
  const playToiletSound = async () => {
    if (toiletSoundRef.current && !audioState.isToiletPlaying) {
      try {
        toiletSoundRef.current.currentTime = 0;
        await toiletSoundRef.current.play();
        setAudioState(prev => ({ ...prev, isToiletPlaying: true }));

        toiletSoundRef.current.onended = () => {
          setAudioState(prev => ({ ...prev, isToiletPlaying: false }));
        };
      } catch (error) {
        console.error('Ошибка воспроизведения звука туалета:', error);
      }
    }
  };

  // Функция для воспроизведения звука победы
  const playVictorySound = async () => {
    if (victorySoundRef.current && !audioState.isVictoryPlaying) {
      try {
        // Останавливаем фоновую музыку на время звука победы
        if (backgroundMusicRef.current && audioState.isBackgroundPlaying) {
          backgroundMusicRef.current.pause();
        }

        victorySoundRef.current.currentTime = 0;
        await victorySoundRef.current.play();
        setAudioState(prev => ({ ...prev, isVictoryPlaying: true }));

        victorySoundRef.current.onended = () => {
          setAudioState(prev => ({ ...prev, isVictoryPlaying: false }));
          // Возвращаем фоновую музыку после окончания звука победы
          if (backgroundMusicRef.current) {
            backgroundMusicRef.current.play();
          }
        };
      } catch (error) {
        console.error('Ошибка воспроизведения звука победы:', error);
        // В случае ошибки возвращаем фоновую музыку
        if (backgroundMusicRef.current) {
          backgroundMusicRef.current.play();
        }
      }
    }
  };

  // Функция для воспроизведения звука аптечки
  const playMedkitSound = async () => {
    if (medkitSoundRef.current && !audioState.isMedkitPlaying) {
      try {
        medkitSoundRef.current.currentTime = 0;
        await medkitSoundRef.current.play();
        setAudioState(prev => ({ ...prev, isMedkitPlaying: true }));

        medkitSoundRef.current.onended = () => {
          setAudioState(prev => ({ ...prev, isMedkitPlaying: false }));
        };
      } catch (error) {
        console.error('Ошибка воспроизведения звука аптечки:', error);
      }
    }
  };

  // Функция для воспроизведения звука запуска
  const playLaunchSound = async () => {
    if (launchSoundRef.current && !audioState.isLaunchPlaying) {
      try {
        launchSoundRef.current.currentTime = 0;
        await launchSoundRef.current.play();
        setAudioState(prev => ({ ...prev, isLaunchPlaying: true }));

        launchSoundRef.current.onended = () => {
          setAudioState(prev => ({ ...prev, isLaunchPlaying: false }));
        };
      } catch (error) {
        console.error('Ошибка воспроизведения звука запуска:', error);
      }
    }
  };

  // Функция для настройки громкости
  const setVolume = (type: 'background' | 'transition', volume: number) => {
    if (type === 'background' && backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = Math.max(0, Math.min(1, volume));
    } else if (type === 'transition' && transitionSoundRef.current) {
      transitionSoundRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  };

  return {
    startBackgroundMusic,
    stopBackgroundMusic,
    playTransitionSound,
    playCoolerSound,
    playToiletSound,
    playVictorySound,
    playMedkitSound,
    playLaunchSound,
    setVolume,
    isBackgroundPlaying: audioState.isBackgroundPlaying,
    isTransitionPlaying: audioState.isTransitionPlaying,
  };
}; 
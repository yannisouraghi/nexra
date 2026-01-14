'use client';

import { useState, useRef, useEffect } from 'react';
import { VideoClip, formatTimestamp } from '@/types/analysis';

interface VideoClipPlayerProps {
  clips: VideoClip[];
  matchId?: string;
  selectedClipId?: string | null;
  onClipSelect?: (clipId: string | null) => void;
}

const API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'http://localhost:8787';

export default function VideoClipPlayer({ clips, matchId, selectedClipId, onClipSelect }: VideoClipPlayerProps) {
  // Find initial clip from selectedClipId or default to first clip
  const getInitialClip = () => {
    if (selectedClipId) {
      return clips.find(c => c.id === selectedClipId) || clips[0] || null;
    }
    return clips[0] || null;
  };

  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(getInitialClip());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoChecking, setVideoChecking] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl = matchId ? `${API_URL}/recordings/${matchId}/video` : null;

  // Check if video actually exists before trying to load it
  useEffect(() => {
    const checkVideo = async () => {
      if (!matchId) {
        setVideoChecking(false);
        setVideoError(true);
        return;
      }

      try {
        // Quick HEAD request to check if video exists
        const response = await fetch(`${API_URL}/recordings/${matchId}/video`, {
          method: 'HEAD',
        });

        if (!response.ok) {
          setVideoError(true);
        }
      } catch {
        setVideoError(true);
      }
      setVideoChecking(false);
    };

    checkVideo();
  }, [matchId]);

  // Update selected clip when selectedClipId changes from parent
  useEffect(() => {
    if (selectedClipId) {
      const clip = clips.find(c => c.id === selectedClipId);
      if (clip && clip.id !== selectedClip?.id) {
        setSelectedClip(clip);
      }
    }
  }, [selectedClipId, clips]);

  const getClipTypeColor = (type: VideoClip['type']) => {
    switch (type) {
      case 'error': return '#ff3366';
      case 'death': return '#ff6b35';
      case 'highlight': return '#00ff88';
    }
  };

  const getClipTypeLabel = (type: VideoClip['type']) => {
    switch (type) {
      case 'error': return 'Erreur';
      case 'death': return 'Mort';
      case 'highlight': return 'Highlight';
    }
  };

  // Handle clip selection - seek to clip start time
  useEffect(() => {
    if (selectedClip && videoRef.current && videoLoaded) {
      const startTime = selectedClip.startTime || selectedClip.timestamp - 5;
      videoRef.current.currentTime = Math.max(0, startTime);
      setIsPlaying(false);
    }
  }, [selectedClip, videoLoaded]);

  // Update current time while playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      // Auto-stop at clip end time
      if (selectedClip?.endTime && video.currentTime >= selectedClip.endTime) {
        video.pause();
        setIsPlaying(false);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setVideoLoaded(true);
    };

    const handleError = () => setVideoError(true);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [selectedClip]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !selectedClip) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clipStart = selectedClip.startTime || selectedClip.timestamp - 5;
    const clipEnd = selectedClip.endTime || selectedClip.timestamp + 15;
    const clipDuration = clipEnd - clipStart;
    const progress = clickX / rect.width;
    const newTime = clipStart + (progress * clipDuration);
    videoRef.current.currentTime = Math.max(clipStart, Math.min(clipEnd, newTime));
  };

  const getClipProgress = () => {
    if (!selectedClip) return 0;
    const clipStart = selectedClip.startTime || selectedClip.timestamp - 5;
    const clipEnd = selectedClip.endTime || selectedClip.timestamp + 15;
    const clipDuration = clipEnd - clipStart;
    const progress = (currentTime - clipStart) / clipDuration;
    return Math.max(0, Math.min(100, progress * 100));
  };

  const handleClipSelect = (clip: VideoClip) => {
    setSelectedClip(clip);
    setIsPlaying(false);
    onClipSelect?.(clip.id);
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Video Player */}
      <div style={styles.playerSection}>
        {selectedClip ? (
          <div>
            {/* Video Container */}
            <div style={styles.videoContainer}>
              {videoUrl && !videoError && !videoChecking ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  style={styles.video}
                  onClick={togglePlay}
                  preload="metadata"
                />
              ) : (
                <div style={styles.videoPlaceholder}>
                  <div style={styles.placeholderIcon}>
                    {videoChecking ? (
                      <div style={styles.loadingSpinner} />
                    ) : (
                      <svg width="48" height="48" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <p style={styles.placeholderText}>
                    {videoChecking
                      ? 'Vérification de la vidéo...'
                      : videoError
                        ? 'Vidéo non disponible'
                        : 'Chargement de la vidéo...'}
                  </p>
                  {videoError && !videoChecking && (
                    <p style={styles.placeholderSubtext}>
                      Enregistre une partie avec Nexra Vision pour voir les clips vidéo
                    </p>
                  )}
                </div>
              )}

              {/* Play overlay on video */}
              {videoLoaded && !isPlaying && (
                <button onClick={togglePlay} style={styles.playOverlay}>
                  <div style={styles.playOverlayButton}>
                    <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              )}

              {/* Clip Info Overlay */}
              <div style={styles.clipOverlay}>
                <div style={styles.clipOverlayHeader}>
                  <span style={{
                    ...styles.clipTypeBadge,
                    backgroundColor: `${getClipTypeColor(selectedClip.type)}30`,
                    color: getClipTypeColor(selectedClip.type),
                  }}>
                    {getClipTypeLabel(selectedClip.type)}
                  </span>
                  <span style={styles.clipTime}>
                    {formatTimestamp(selectedClip.startTime || selectedClip.timestamp - 5)} → {formatTimestamp(selectedClip.endTime || selectedClip.timestamp + 15)}
                  </span>
                </div>
                <h4 style={styles.clipTitle}>{selectedClip.title}</h4>
              </div>
            </div>

            {/* Controls */}
            <div style={styles.controls}>
              <button onClick={togglePlay} style={styles.playButton}>
                {isPlaying ? (
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div style={styles.progressBar} onClick={handleProgressClick}>
                <div style={{ ...styles.progressFill, width: `${getClipProgress()}%` }} />
              </div>

              <span style={styles.timeDisplay}>
                {formatTimestamp(currentTime)} / {formatTimestamp(selectedClip.endTime || selectedClip.timestamp + 15)}
              </span>

              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                style={styles.speedSelect}
              >
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            {/* Description */}
            <div style={styles.descriptionBox}>
              <div style={styles.descriptionHeader}>
                <svg width="16" height="16" fill="none" stroke="#00d4ff" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Description du moment</span>
              </div>
              <p style={styles.descriptionText}>{selectedClip.description}</p>
              {selectedClip.errorId && (
                <div style={styles.linkedError}>
                  <svg width="14" height="14" fill="none" stroke="#ff6b35" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Ce clip est lié à une erreur détectée. Consulte l'onglet Erreurs pour plus de détails.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={styles.noClipSelected}>
            <svg width="48" height="48" fill="none" stroke="rgba(255,255,255,0.2)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>Sélectionne un clip à regarder</p>
          </div>
        )}
      </div>

      {/* Clips Sidebar */}
      <div style={styles.sidebar}>
        <h4 style={styles.sidebarTitle}>
          Clips Disponibles
          <span style={styles.clipCount}>{clips.length}</span>
        </h4>
        {clips.length === 0 ? (
          <div style={styles.noClips}>
            <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.2)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p>Aucun clip disponible</p>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Les clips sont générés à partir des erreurs détectées</span>
          </div>
        ) : (
          <div style={styles.clipsList}>
            {clips.map((clip, index) => {
              const isSelected = selectedClip?.id === clip.id;
              const typeColor = getClipTypeColor(clip.type);

              return (
                <button
                  key={clip.id}
                  onClick={() => handleClipSelect(clip)}
                  style={{
                    ...styles.clipCard,
                    backgroundColor: isSelected ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                    borderColor: isSelected ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Clip Number */}
                  <div style={{
                    ...styles.clipNumber,
                    backgroundColor: isSelected ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                  }}>
                    {index + 1}
                  </div>

                  <div style={styles.clipInfo}>
                    <div style={styles.clipMeta}>
                      <span style={{ ...styles.clipDot, backgroundColor: typeColor }} />
                      <span style={styles.clipTimestamp}>
                        {formatTimestamp(clip.startTime || clip.timestamp - 5)} - {formatTimestamp(clip.endTime || clip.timestamp + 15)}
                      </span>
                      <span style={{ color: typeColor, fontSize: 11, fontWeight: 600 }}>
                        {getClipTypeLabel(clip.type)}
                      </span>
                    </div>
                    <p style={styles.clipName}>{clip.title}</p>
                    {clip.errorId && (
                      <span style={styles.clipErrorLink}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        </svg>
                        Lié à une erreur
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    gap: 24,
  },
  playerSection: {
    flex: 1,
  },
  videoContainer: {
    position: 'relative',
    aspectRatio: '16/9',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    cursor: 'pointer',
  },
  videoPlaceholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  placeholderSubtext: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(0,212,255,0.2)',
    borderTopColor: '#00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  playOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)',
    border: 'none',
    cursor: 'pointer',
  },
  playOverlayButton: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: 'rgba(0,212,255,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  clipOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
  },
  clipOverlayHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  clipTypeBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  },
  clipTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'monospace',
  },
  clipTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'white',
    margin: 0,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    cursor: 'pointer',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
    borderRadius: 4,
    transition: 'width 0.1s',
  },
  timeDisplay: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.5)',
    minWidth: 100,
  },
  speedSelect: {
    padding: '6px 10px',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: 13,
    outline: 'none',
  },
  descriptionBox: {
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  descriptionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: 600,
    color: '#00d4ff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  linkedError: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  noClipSelected: {
    aspectRatio: '16/9',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebar: {
    width: 340,
  },
  sidebarTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    fontWeight: 600,
    color: 'white',
    marginBottom: 16,
  },
  clipCount: {
    padding: '2px 8px',
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.15)',
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: 600,
  },
  noClips: {
    padding: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  clipsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxHeight: 500,
    overflowY: 'auto',
  },
  clipCard: {
    display: 'flex',
    gap: 14,
    padding: 14,
    borderRadius: 10,
    border: '1px solid',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s',
  },
  clipNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
    flexShrink: 0,
  },
  clipInfo: {
    flex: 1,
    minWidth: 0,
  },
  clipMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  clipDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  },
  clipTimestamp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'monospace',
  },
  clipName: {
    fontSize: 14,
    fontWeight: 500,
    color: 'white',
    margin: '0 0 4px 0',
    lineHeight: 1.4,
  },
  clipErrorLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: '#ff6b35',
    marginTop: 4,
  },
};

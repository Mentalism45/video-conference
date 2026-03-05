const roomId = window.location.pathname.split('/').pop();
const socket = io();

const videoGrid = document.getElementById('video-grid');
const roomLinkText = document.getElementById('room-link-text');

const toggleMicBtn = document.getElementById('toggle-mic-btn');
const toggleCameraBtn = document.getElementById('toggle-camera-btn');
const leaveBtn = document.getElementById('leave-btn');

let localStream;
let micEnabled = true;
let cameraEnabled = true;

// peerId -> { pc, videoEl }
const peers = {};

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

roomLinkText.textContent = `Meeting link: ${window.location.href}`;

function createVideoElement({ muted = false, label = '' } = {}) {
  const container = document.createElement('div');
  const video = document.createElement('video');
  video.autoplay = true;
  video.playsInline = true;
  video.muted = muted;

  container.appendChild(video);

  if (label) {
    const caption = document.createElement('div');
    caption.textContent = label;
    caption.style.marginTop = '4px';
    caption.style.fontSize = '0.8rem';
    caption.style.color = '#9ca3af';
    container.appendChild(caption);
  }

  videoGrid.appendChild(container);
  return { container, video };
}

async function initMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const { video } = createVideoElement({ muted: true, label: 'You' });
    video.srcObject = localStream;
  } catch (err) {
    alert('Could not access camera/microphone. Please allow permissions.');
    console.error(err);
  }
}

function createPeerConnection(peerId) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  const { video, container } = createVideoElement({ muted: false });

  pc.ontrack = event => {
    const [stream] = event.streams;
    video.srcObject = stream;
  };

  pc.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        to: peerId,
        candidate: event.candidate,
      });
    }
  };

  peers[peerId] = { pc, videoEl: video, container };
  return pc;
}

socket.emit('join-room', roomId);

socket.on('existing-users', async users => {
  if (!localStream) {
    await initMedia();
  }

  for (const userId of users) {
    const pc = createPeerConnection(userId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { to: userId, offer });
  }
});

socket.on('offer', async ({ from, offer }) => {
  if (!localStream) {
    await initMedia();
  }

  let entry = peers[from];
  if (!entry) {
    const pc = createPeerConnection(from);
    entry = peers[from];
    entry.pc = pc;
  }

  const { pc } = entry;
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('answer', { to: from, answer });
});

socket.on('answer', async ({ from, answer }) => {
  const entry = peers[from];
  if (!entry) return;
  await entry.pc.setRemoteDescription(answer);
});

socket.on('ice-candidate', async ({ from, candidate }) => {
  const entry = peers[from];
  if (!entry) return;
  try {
    await entry.pc.addIceCandidate(candidate);
  } catch (e) {
    console.error('Error adding received ice candidate', e);
  }
});

socket.on('user-left', id => {
  const entry = peers[id];
  if (!entry) return;

  entry.pc.close();
  if (entry.videoEl && entry.videoEl.srcObject) {
    entry.videoEl.srcObject.getTracks().forEach(t => t.stop());
  }
  if (entry.container && entry.container.parentNode) {
    entry.container.parentNode.removeChild(entry.container);
  }

  delete peers[id];
});

toggleMicBtn.addEventListener('click', () => {
  if (!localStream) return;
  micEnabled = !micEnabled;
  localStream.getAudioTracks().forEach(t => {
    t.enabled = micEnabled;
  });
  toggleMicBtn.textContent = micEnabled ? 'Mute' : 'Unmute';
});

toggleCameraBtn.addEventListener('click', () => {
  if (!localStream) return;
  cameraEnabled = !cameraEnabled;
  localStream.getVideoTracks().forEach(t => {
    t.enabled = cameraEnabled;
  });
  toggleCameraBtn.textContent = cameraEnabled ? 'Stop Video' : 'Start Video';
});

leaveBtn.addEventListener('click', () => {
  Object.values(peers).forEach(entry => {
    entry.pc.close();
    if (entry.videoEl && entry.videoEl.srcObject) {
      entry.videoEl.srcObject.getTracks().forEach(t => t.stop());
    }
    if (entry.container && entry.container.parentNode) {
      entry.container.parentNode.removeChild(entry.container);
    }
  });

  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }

  socket.disconnect();
  window.location.href = '/';
});

// Start local media immediately so the first user sees themselves
initMedia();


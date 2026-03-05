function generateRoomId() {
  return Math.random().toString(36).substring(2, 10);
}

document.addEventListener('DOMContentLoaded', () => {
  const createBtn = document.getElementById('create-meeting-btn');
  const joinInput = document.getElementById('join-link-input');
  const joinBtn = document.getElementById('join-link-btn');

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const roomId = generateRoomId();
      const url = `${window.location.origin}/room/${roomId}`;
      window.location.href = url;
    });
  }

  if (joinBtn && joinInput) {
    joinBtn.addEventListener('click', () => {
      const value = joinInput.value.trim();
      if (!value) return;

      try {
        const url = new URL(value);
        window.location.href = url.toString();
      } catch {
        // Allow user to paste just the room id
        window.location.href = `${window.location.origin}/room/${value}`;
      }
    });
  }
});


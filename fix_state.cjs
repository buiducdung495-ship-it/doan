const fs = require('fs');
let content = fs.readFileSync('src/components/LiveChat.tsx', 'utf-8');
content = content.replace(
  /const \[showAddMemberModal, setShowAddMemberModal\] = useState\(false\);/,
  "const [showAddMemberModal, setShowAddMemberModal] = useState(false);\n  const [activeVideoCall, setActiveVideoCall] = useState<{ isOpen: boolean, partnerName: string, isGroup: boolean }>({ isOpen: false, partnerName: '', isGroup: false });\n  const [isVideoMuted, setIsVideoMuted] = useState(false);\n  const [isAudioMuted, setIsAudioMuted] = useState(false);"
);
fs.writeFileSync('src/components/LiveChat.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/components/LiveChat.tsx', 'utf-8');
content = content.replace(
  /FileSignature\n\} from 'lucide-react';/,
  "FileSignature,\n  Video,\n  PhoneCall,\n  PhoneOff,\n  Mic,\n  VideoOff,\n  MicOff\n} from 'lucide-react';"
);
fs.writeFileSync('src/components/LiveChat.tsx', content);

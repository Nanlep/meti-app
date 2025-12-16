
import React from 'react';
import { Button, Modal } from './Shared';
import { PhoneOff, Lock } from 'lucide-react';

interface LiveSessionProps {
  isOpen: boolean;
  onClose: () => void;
  persona: any;
  niche: any;
  productName: string;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enterprise Voice (Beta)">
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <Lock size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Feature Locked</h3>
        <p className="text-slate-400 mb-6">
          The Real-time Voice Strategy feature requires a dedicated secure WebSocket token server which is not currently provisioned in this environment.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Security Protocol 4.2: Client-side API key usage is restricted for Live API.
        </p>
        <Button onClick={onClose} variant="secondary">
          Close Session
        </Button>
      </div>
    </Modal>
  );
};

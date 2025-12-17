
import React, { useState } from 'react';
import { Modal } from './Shared';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms' | 'security';
}

export const LegalDocs: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  const getTitle = () => {
    switch (type) {
        case 'privacy': return 'Privacy Policy';
        case 'terms': return 'Terms of Service';
        case 'security': return 'Security Compliance';
        default: return 'Legal Document';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-4">
        {type === 'privacy' && (
          <>
            <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
            <p>At Meti Marketing Engine, we take your privacy seriously. This policy outlines how we handle your data.</p>
            
            <h4>1. Data Collection</h4>
            <p>We collect information you provide directly, such as project descriptions, target audience data, and account credentials. We also collect usage data to improve our AI models.</p>

            <h4>2. AI Processing</h4>
            <p>Data submitted to our AI tools is processed by Google Gemini. We do not use your proprietary marketing data to train public models without consent.</p>

            <h4>3. Data Security</h4>
            <p>We use industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. Your payment information is handled exclusively by Stripe; we do not store credit card details.</p>

            <h4>4. Contact</h4>
            <p>For privacy concerns, please contact contact@meti.pro.</p>
          </>
        )}
        
        {type === 'terms' && (
          <>
            <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
            <p>By accessing Meti Marketing Engine, you agree to these terms.</p>

            <h4>1. Usage License</h4>
            <p>We grant you a revocable, non-exclusive license to use the platform according to your subscription tier. You may not resell access to the platform itself.</p>

            <h4>2. Subscriptions & Payments</h4>
            <p>Subscriptions are billed monthly. You may cancel at any time. Refunds are processed according to our refund policy (7-day money-back guarantee).</p>

            <h4>3. Liability</h4>
            <p>Meti provides marketing suggestions based on AI. We do not guarantee specific financial results or conversion rates from using our generated content.</p>

            <h4>4. Termination</h4>
            <p>We reserve the right to terminate accounts that violate these terms or abuse our API limits.</p>
          </>
        )}

        {type === 'security' && (
          <>
            <p><strong>Security Posture Overview</strong></p>
            <p>Meti is designed with a security-first approach to protect sensitive marketing strategy and client data.</p>

            <h4>1. Infrastructure Security</h4>
            <p>Our platform runs on secure, isolated cloud environments with automated intrusion detection and DDOS protection. We conduct regular vulnerability scans.</p>

            <h4>2. Data Encryption</h4>
            <p>All data is encrypted in transit using TLS 1.2+ and at rest using AES-256 encryption. API keys are hashed and salted before storage.</p>

            <h4>3. Access Control</h4>
            <p>We employ Role-Based Access Control (RBAC) to ensure employees only have access to data necessary for their role. Multi-Factor Authentication (MFA) is enforced for administrative access.</p>

            <h4>4. Compliance</h4>
            <p>We follow SOC 2 Type II and GDPR guidelines for data handling and processing.</p>
          </>
        )}

        <div className="pt-4 border-t border-slate-800">
          <button onClick={onClose} className="w-full py-2 bg-slate-800 rounded hover:bg-slate-700 text-white transition-colors">
            Close Document
          </button>
        </div>
      </div>
    </Modal>
  );
};

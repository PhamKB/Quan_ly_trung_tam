import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { Modal, Button } from './Common';
import { validateNewPassword, verifyPassword, hashPassword } from '../lib/accountUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';

interface FirstLoginModalProps {
  isOpen: boolean;
  user: User;
  onSuccess: (updatedUser: User) => void;
  onRaiseToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onLogAudit?: (action: string, target: string, status: 'Success' | 'Warning' | 'Critical', details: string) => Promise<void>;
}

export const FirstLoginModal: React.FC<FirstLoginModalProps> = ({
  isOpen,
  user,
  onSuccess,
  onRaiseToast,
  onLogAudit
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentPassword.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại (hoặc mật khẩu tạm thời).');
      return;
    }

    // Verify current password against stored hash if available
    if (user.passwordHash) {
      const isCurrentValid = verifyPassword(currentPassword.trim(), user.passwordHash);
      if (!isCurrentValid) {
        setErrorMsg('Mật khẩu hiện tại không chính xác.');
        return;
      }
    }

    // Validate new password rules
    const validation = validateNewPassword(newPassword, confirmPassword, currentPassword);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Mật khẩu mới không hợp lệ.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newHash = hashPassword(newPassword);
      const updatedUser: User = {
        ...user,
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date().toISOString()
      };

      // Firestore Update
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date().toISOString()
      });

      if (onLogAudit) {
        await onLogAudit(
          'CHANGE_PASSWORD',
          `users/${user.id}`,
          'Success',
          `Người dùng ${user.name} (${user.id}) đã đổi mật khẩu thành công trong lần đăng nhập đầu tiên.`
        );
      }

      onRaiseToast('✓ Đổi mật khẩu thành công! Chào mừng bạn đến với hệ thống.', 'success');
      onSuccess(updatedUser);
    } catch (err: any) {
      console.error('Error changing password on first login:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
      setErrorMsg(`Đổi mật khẩu thất bại: ${err?.message || 'Lỗi không xác định'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        // First login password change is mandatory — cannot close without changing
        onRaiseToast('⚠️ Bạn bắt buộc phải đổi mật khẩu lần đầu để sử dụng hệ thống.', 'warning');
      }}
      title="YÊU CẦU ĐỔI MẬT KHẨU LẦN ĐẦU"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-[#2D3748]">
        <div className="p-3 bg-[#EAF4FF] border border-[#B2D4FF] rounded-xl flex items-start space-x-2 text-[#1C6DD0]">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-[#1C6DD0]" />
          <div>
            <p className="font-bold text-xs">Chào mừng {user.name}!</p>
            <p className="text-[11px] mt-0.5 text-[#4A5568]">
              Tài khoản của bạn hiện đang sử dụng mật khẩu tạm thời. Vì lý do bảo mật, vui lòng thiết lập mật khẩu mới trước khi truy cập Workspace.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase text-[#718096] mb-1">
            Mật khẩu tạm thời / Hiện tại *
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu được cấp..."
              required
              className="w-full h-10 px-3 pr-10 border border-[#DCE7F3] rounded-lg text-xs font-medium focus:border-[#1C6DD0]"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-2.5 text-[#718096] hover:text-[#2D3748]"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-[#718096] mb-1">
            Mật khẩu mới * (Tối thiểu 6 ký tự)
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              required
              minLength={6}
              className="w-full h-10 px-3 pr-10 border border-[#DCE7F3] rounded-lg text-xs font-medium focus:border-[#1C6DD0]"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-2.5 text-[#718096] hover:text-[#2D3748]"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-[#718096] mb-1">
            Xác nhận mật khẩu mới *
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              required
              minLength={6}
              className="w-full h-10 px-3 pr-10 border border-[#DCE7F3] rounded-lg text-xs font-medium focus:border-[#1C6DD0]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5 text-[#718096] hover:text-[#2D3748]"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="p-3 bg-[#F7FAFC] border border-[#DCE7F3] rounded-lg text-[11px] text-[#718096] space-y-1">
          <p className="font-bold text-[#2D3748]">Quy tắc mật khẩu an toàn:</p>
          <p>• Ít nhất 6 ký tự trở lên.</p>
          <p>• Không trùng với mật khẩu tạm thời.</p>
          <p>• Nên bao gồm cả chữ và số để tăng độ bảo mật.</p>
        </div>

        <div className="pt-3 border-t border-[#DCE7F3] flex justify-end">
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <Lock className="h-4 w-4 mr-1.5" />
            {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận & Vào Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

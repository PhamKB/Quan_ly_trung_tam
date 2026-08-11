import React, { ReactNode } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  AlertTriangle, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sliders, 
  RefreshCw 
} from 'lucide-react';

// Breadcrumb type
export interface BreadcrumbItem {
  label: string;
  active?: boolean;
}

// 1. Page Header Component
interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description: string;
  action?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ breadcrumbs, title, description, action }) => {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#DCE7F3] pb-6 md:flex-row md:items-end">
      <div>
        <nav className="mb-1.5 flex items-center space-x-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              <span className={b.active ? 'text-[#1C6DD0]' : ''}>{b.label}</span>
              {i < breadcrumbs.length - 1 && <span className="opacity-40">/</span>}
            </React.Fragment>
          ))}
        </nav>
        <h1 className="font-display text-[28px] font-extrabold tracking-tight text-[#2D3748] leading-tight">{title}</h1>
        <p className="mt-1 text-[13px] text-[#718096]">{description}</p>
      </div>
      {action && <div className="flex items-center space-x-2 shrink-0">{action}</div>}
    </div>
  );
};

// 2. Metric KPI Card
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, trend, subtitle }) => {
  return (
    <div className="bg-white p-5 border border-[#DCE7F3] rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:border-[#2F80ED] h-[115px]">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">{label}</span>
        {trend ? (
          <span className={`text-xs font-bold ${trend.isPositive ? 'text-[#27AE60]' : 'text-[#EB5757]'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        ) : (
          <div className="text-[#94A3B8] opacity-75">{icon}</div>
        )}
      </div>
      <div className="mt-2 flex flex-col justify-end">
        <div className="font-display text-2xl font-extrabold text-[#2D3748] tracking-tight leading-none">{value}</div>
        {!trend && subtitle ? (
          <span className="text-[11px] text-[#718096] mt-1.5 truncate">{subtitle}</span>
        ) : trend && subtitle ? (
          <span className="text-[10px] text-[#94A3B8] mt-1.5 truncate">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
};

// 3. Reusable Card Component
interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  headerAction?: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, children, headerAction, className = '' }) => {
  return (
    <div className={`rounded-2xl border border-[#DCE7F3] bg-white p-6 shadow-sm ${className}`}>
      {(title || headerAction) && (
        <div className="mb-4 flex items-center justify-between border-b border-[#F7FAFC] pb-3.5">
          <div>
            {title && <h3 className="font-display text-[16px] font-extrabold text-[#2D3748] tracking-tight leading-snug">{title}</h3>}
            {subtitle && <p className="text-[11px] text-[#718096] mt-1 leading-normal">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex items-center space-x-2 shrink-0">{headerAction}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

// 4. Custom Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'soft' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', children, className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#2F80ED] hover:bg-[#1C6DD0] text-white",
    secondary: "bg-white border border-[#DCE7F3] hover:bg-[#F7FAFC] text-[#2D3748]",
    soft: "bg-[#F7FAFC] border border-transparent hover:bg-[#EAF4FF] hover:text-[#1C6DD0] text-[#718096]",
    destructive: "bg-[#EB5757] hover:bg-[#C0392B] text-white",
    outline: "bg-transparent border border-[#2F80ED] hover:bg-[#EAF4FF] text-[#2F80ED]"
  };

  const sizes = {
    sm: "h-8 px-3 rounded-lg text-xs",
    md: "h-10 px-4 rounded-lg text-xs md:text-sm",
    lg: "h-12 px-6 rounded-xl text-sm md:text-base",
    icon: "h-9 w-9 rounded-lg"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

// 5. Custom Badge Component
interface BadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral' | string;
  children: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, children, className = '' }) => {
  const colors: Record<string, string> = {
    success: 'bg-[#EBF7EE] text-[#27AE60] border-[#D4EFDF]',
    warning: 'bg-[#FEF9E7] text-[#D4AC0D] border-[#FCF3CF]',
    error: 'bg-[#FDEDEC] text-[#EB5757] border-[#FADBD8]',
    info: 'bg-[#EAF4FF] text-[#1C6DD0] border-[#D6EAF8]',
    neutral: 'bg-[#F2F4F4] text-[#718096] border-[#E5E7E9]',
    // Custom risk badge options
    'Low': 'bg-[#EBF7EE] text-[#27AE60] border-[#D4EFDF]',
    'Medium': 'bg-[#FEF9E7] text-[#D4AC0D] border-[#FCF3CF]',
    'High': 'bg-[#FDEDEC] text-[#EB5757] border-[#FADBD8]',
    // Detailed specific Vietnamese statuses
    'Đang hoạt động': 'bg-[#EBF7EE] text-[#27AE60] border-[#D4EFDF]',
    'Sắp khai giảng': 'bg-[#FEF9E7] text-[#D4AC0D] border-[#FCF3CF]',
    'Đã hoàn thành': 'bg-[#EBEDEF] text-[#7F8C8D] border-[#D5D8DC]',
    'Đang học': 'bg-[#EBF7EE] text-[#27AE60] border-[#D4EFDF]',
    'Chờ xử lý': 'bg-[#FEF9E7] text-[#D4AC0D] border-[#FCF3CF]',
    'Đã duyệt': 'bg-[#EAF4FF] text-[#1C6DD0] border-[#D6EAF8]',
    'Còn nợ': 'bg-[#FDEDEC] text-[#EB5757] border-[#FADBD8]',
    'Nợ quá hạn': 'bg-[#FDEDEC] text-[#EB5757] border-[#FADBD8]',
    'Đã thanh toán': 'bg-[#EBF7EE] text-[#27AE60] border-[#D4EFDF]',
    'Paid': 'bg-[#EBF7EE] text-[#27AE60] border-[#D4EFDF]',
    'Partially Paid': 'bg-[#FEF9E7] text-[#D4AC0D] border-[#FCF3CF]',
    'Overdue': 'bg-[#FDEDEC] text-[#EB5757] border-[#FADBD8]',
    'Draft': 'bg-[#F2F4F4] text-[#718096] border-[#E5E7E9]',
    'Issued': 'bg-[#EAF4FF] text-[#1C6DD0] border-[#D6EAF8]',
    'Cancelled': 'bg-[#EBEDEF] text-[#7F8C8D] border-[#D5D8DC]',
    'Refunded': 'bg-[#FDEDEC] text-[#EB5757] border-[#FADBD8]',
  };

  const selectedColor = colors[status] || 'bg-[#F2F4F4] text-[#718096] border-[#E5E7E9]';

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${selectedColor} ${className}`}>
      {children}
    </span>
  );
};

// 6. Search input bar
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchChange?: (val: string) => void;
  onClearFilters?: () => void;
  showFiltersBtn?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  onSearchChange, 
  onClearFilters, 
  showFiltersBtn = false, 
  placeholder = "Tìm kiếm...", 
  className = "", 
  ...props 
}) => {
  return (
    <div className={`relative flex items-center w-full max-w-sm ${className}`}>
      <Search className="absolute left-3 h-4.5 w-4.5 text-[#94A3B8]" />
      <input 
        type="text" 
        className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] pl-10 pr-10 text-xs md:text-sm text-[#2D3748] placeholder-[#94A3B8] transition-all focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
        placeholder={placeholder}
        onChange={(e) => onSearchChange?.(e.target.value)}
        {...props}
      />
      {onClearFilters && (
        <button 
          onClick={onClearFilters}
          className="absolute right-3 cursor-pointer text-xs text-[#1C6DD0] font-semibold hover:underline"
          title="Xóa tất cả bộ lọc"
        >
          Xóa
        </button>
      )}
    </div>
  );
};

// 7. Modal Base Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  footer, 
  size = 'md' 
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay with glass/blur effect */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className={`relative z-10 w-full ${sizes[size]} transform overflow-hidden rounded-2xl border border-[#DCE7F3] bg-white text-left shadow-2xl transition-all duration-300 max-h-[85vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDF2F7] p-5">
          <div>
            <h3 className="font-display text-lg font-bold text-[#2D3748]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-[#718096]">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100 text-[#718096] hover:text-[#2D3748] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-sm text-[#2D3748]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2 border-t border-[#EDF2F7] bg-[#F7FAFC] p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// 8. Simple Toast Notification System
interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-[#27AE60]" />,
    info: <AlertCircle className="h-5 w-5 text-[#2D9CDB]" />,
    warning: <AlertTriangle className="h-5 w-5 text-[#F2C94C]" />,
    error: <XCircle className="h-5 w-5 text-[#EB5757]" />
  };

  const borders = {
    success: 'border-[#D4EFDF] bg-[#EBF7EE]',
    info: 'border-[#D6EAF8] bg-[#EAF4FF]',
    warning: 'border-[#FCF3CF] bg-[#FEF9E7]',
    error: 'border-[#FADBD8] bg-[#FDEDEC]'
  };

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 max-w-sm md:max-w-md ${borders[type]}`}>
      {icons[type]}
      <p className="text-xs font-semibold text-[#2D3748] pr-2">{message}</p>
      <button 
        onClick={onClose}
        className="ml-auto rounded-lg p-0.5 hover:bg-black/5 text-[#718096] hover:text-[#2D3748] cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// 9. Beautiful Empty State Component
interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  icon?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "Không có dữ liệu", 
  description = "Không tìm thấy kết quả phù hợp với các bộ lọc hiện tại.", 
  onReset,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DCE7F3] p-10 text-center bg-white my-4">
      {icon ? (
        <div className="mb-3 text-[#94A3B8]">{icon}</div>
      ) : (
        <AlertTriangle className="mb-3 h-10 w-10 text-[#94A3B8]" />
      )}
      <h3 className="font-display text-sm font-bold text-[#2D3748]">{title}</h3>
      <p className="mt-1 text-xs text-[#718096] max-w-xs">{description}</p>
      {onReset && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onReset}>
          Đặt lại bộ lọc
        </Button>
      )}
    </div>
  );
};

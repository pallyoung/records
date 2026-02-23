import { useEffect, useCallback, type ReactNode } from 'react';
import { Button, type ButtonProps } from '../button';
import styles from './index.module.scss';

export interface ModalProps {
  /** 是否可见 */
  visible: boolean;
  /** 标题 */
  title?: ReactNode;
  /** 内容 */
  children?: ReactNode;
  /** 宽度 */
  width?: number | string;
  /** 点击遮罩层是否可关闭 */
  maskClosable?: boolean;
  /** 显示关闭按钮 */
  showClose?: boolean;
  /** 底部内容（设为 null 可隐藏底部） */
  footer?: ReactNode | null;
  /** 确认按钮配置 */
  okButtonProps?: ButtonProps;
  /** 取消按钮配置 */
  cancelButtonProps?: ButtonProps;
  /** 确认按钮文字 */
  okText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 是否显示遮罩层 */
  mask?: boolean;
  /** 遮罩层样式 */
  maskStyle?: React.CSSProperties;
  /** 内容区域样式 */
  bodyStyle?: React.CSSProperties;
  /** 弹窗样式 */
  style?: React.CSSProperties;
  /** 弹窗类名 */
  className?: string;
  /** 关闭回调 */
  onClose?: () => void;
  /** 确认回调 */
  onOk?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 动画结束后回调 */
  // afterClose?: () => void;
}

export function Modal({
  visible,
  title,
  children,
  width = 520,
  maskClosable = true,
  showClose = true,
  footer,
  okButtonProps,
  cancelButtonProps,
  okText = '确认',
  cancelText = '取消',
  mask = true,
  maskStyle,
  bodyStyle,
  style,
  className = '',
  onClose,
  onOk,
  onCancel,
  // afterClose,
}: ModalProps) {
  // 处理 ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose?.();
      }
    },
    [visible, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 处理遮罩层点击
  const handleMaskClick = () => {
    if (maskClosable) {
      onClose?.();
    }
  };

  // 处理确认
  const handleOk = () => {
    onOk?.();
  };

  // 处理取消
  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  // 如果没有 visible，不渲染（除了 afterClose 需要处理）
  if (!visible) {
    return null;
  }

  // 计算宽度样式
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  // 默认底部按钮
  const defaultFooter = (
    <>
      <Button variant="secondary" {...cancelButtonProps} onClick={handleCancel}>
        {cancelText}
      </Button>
      <Button variant="primary" {...okButtonProps} onClick={handleOk}>
        {okText}
      </Button>
    </>
  );

  return (
    <div className={`${styles.modalWrapper} ${className}`}>
      {/* 遮罩层 */}
      {mask && (
        <div
          className={styles.modalMask}
          style={maskStyle}
          onClick={handleMaskClick}
        />
      )}

      {/* 弹窗内容 */}
      <div
        className={styles.modal}
        style={{
          ...style,
          width: widthStyle,
        }}
      >
        {/* 头部 */}
        {(title || showClose) && (
          <div className={styles.modalHeader}>
            {title && (
              <div className={styles.modalTitle}>
                {typeof title === 'string' ? (
                  <h3>{title}</h3>
                ) : (
                  title
                )}
              </div>
            )}
            {showClose && (
              <button
                className={styles.modalClose}
                onClick={onClose}
                aria-label="关闭"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <div className={styles.modalBody} style={bodyStyle}>
          {children}
        </div>

        {/* 底部 */}
        {footer !== null && (
          <div className={styles.modalFooter}>
            {footer === undefined ? defaultFooter : footer}
          </div>
        )}
      </div>
    </div>
  );
}

// 便捷方法：显示简单确认对话框
// export function confirm(config: {
//   title?: string;
//   content?: ReactNode;
//   okText?: string;
//   cancelText?: string;
//   onOk?: () => void;
//   onCancel?: () => void;
// }): void {
//   // 这里可以实现一个基于 ReactDOM.render 的静态方法
//   // 或者使用 Context 的方式
//   console.warn('Modal.confirm 需要配合 ModalProvider 使用');
// }
